import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { recipientForOffer } from "@/lib/offers/recruiterEmail";
import { getOrCreateInboxAddress, inboxDomain } from "@/lib/inbox/address";
import { getResendClient } from "@/lib/resend/client";
import { generateCoverLetterAction } from "@/app/(app)/candidature/[offerId]/actions";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { LbaError, lbaApiKey, MAX_CV_BYTES, sendLbaApplication } from "@/lib/laBonneAlternance/client";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import { LBA_LABEL, type AutoSendResult } from "@/lib/applications/autoSend";
import type { Offer, Profile } from "@/types/database";

// Like = candidature envoyée, par l'un de deux chemins :
// - « lba » (15/10) : offre La bonne alternance. Le service public transmet
//   lui-même la candidature au recruteur (gratuit, sans Resend) ; la réponse
//   arrive sur l'email de l'étudiant (ou sa boîte Stageio si elle est active).
// - « email » : l'entreprise a publié une adresse ; la lettre part de
//   l'adresse Stageio de l'étudiant via Resend (boîte intégrée).
// Sinon (« manual »), la page de candidature s'ouvre avec la raison.
// Route plutôt que server action : les server actions d'un même onglet
// passent l'une après l'autre, et un envoi (lettre + envoi) prend 10 à 30 s
// -- l'étudiant doit pouvoir continuer à swiper pendant ce temps.
// check=true : vérifications seules (rapide), sans rien envoyer.
export const maxDuration = 60;

const EVENT = "application_emailed";

function json(result: AutoSendResult, status = 200) {
  // Une ligne par issue (visible dans les journaux Vercel) : sans elle, un
  // like qui ne part pas ne laisse aucune trace de la raison.
  console.log(`auto-send: ${result.status}${result.status === "manual" ? ` (${result.reason})` : ""}`);
  return NextResponse.json(result, { status });
}

function cvContentType(path: string): string {
  return /\.docx$/i.test(path)
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";
}

type Admin = ReturnType<typeof createAdminClient>;
type Supabase = Awaited<ReturnType<typeof createClient>>;

async function sentLast24h(admin: Admin, userId: string): Promise<number> {
  const { count } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", EVENT)
    .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
  return count ?? 1;
}

// Copie dans la boîte (onglet « envoyés ») : sert aussi à rattacher la
// réponse du recruteur à cette candidature (voir api/inbox/webhook). Sans
// effet tant que le SQL de la boîte n'est pas passé.
async function storeSentCopy(
  admin: Admin,
  row: { user_id: string; from_address: string; from_name: string | null; to_address: string; subject: string; body_text: string; offer_id: string },
) {
  const { error } = await admin.from("inbox_messages").insert({ ...row, direction: "out", read_at: new Date().toISOString() });
  if (error) console.error("auto-send: copie dans la boîte impossible", error.message);
}

async function downloadCv(admin: Admin, cvPath: string, userId: string): Promise<Blob | null> {
  const { data, error } = await admin.storage.from("cvs").download(cvPath);
  if (error || !data) {
    console.error("auto-send: CV introuvable", error, { userId });
    return null;
  }
  return data;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { offerId?: string; check?: boolean } | null;
  const offerId = body?.offerId;
  if (!offerId) return json({ status: "error" }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ status: "error" }, 401);

  const admin = createAdminClient();
  // select("*") : phone et inbox_address sont des colonnes ajoutées à la
  // main, une liste explicite casserait tout tant qu'elles manquent.
  const [{ data: offer }, { data: profile }, { data: alreadySent }] = await Promise.all([
    supabase.from("offers").select("*").eq("id", offerId).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("user_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", EVENT)
      .contains("metadata", { offerId })
      .limit(1),
  ]);

  if (!offer) return json({ status: "manual", reason: "not_found" });
  const company = offer.company;
  if (!profile || !isPremium(profile)) return json({ status: "manual", reason: "premium_required", company });

  const context = { request: body, user: { id: user.id, email: user.email ?? null }, offer, profile, alreadySent: (alreadySent ?? []).length > 0 };
  if (offer.source === "la_bonne_alternance" && offer.external_id) return applyViaLba(admin, supabase, context);
  return applyByEmail(admin, supabase, context);
}

type Context = {
  request: { offerId?: string; check?: boolean } | null;
  user: { id: string; email: string | null };
  offer: Offer;
  profile: Profile;
  alreadySent: boolean;
};

async function applyViaLba(admin: Admin, supabase: Supabase, { request, user, offer, profile, alreadySent }: Context) {
  const company = offer.company;
  if (!lbaApiKey()) return json({ status: "manual", reason: "lba_off", company });
  if (!profile.cv_path) return json({ status: "manual", reason: "no_cv", company });
  const names = splitFullName(profile.full_name);
  if (!names) return json({ status: "manual", reason: "no_name", company });
  const phone = normalizePhone(profile.phone);
  if (!phone) return json({ status: "manual", reason: "no_phone", company });
  if (alreadySent) return json({ status: "manual", reason: "already_sent", company });

  if (request?.check) return json({ status: "ready", company, to: LBA_LABEL, channel: "lba" });

  // Réponse du recruteur : dans la boîte Stageio si elle est active, sinon
  // sur l'email du compte.
  const replyAddress = (inboxDomain() && (await getOrCreateInboxAddress(admin, user.id, profile.full_name))) || user.email;
  if (!replyAddress) return json({ status: "error", company });

  const cv = await downloadCv(admin, profile.cv_path, user.id);
  if (!cv) return json({ status: "manual", reason: "no_cv", company });
  if (cv.size > MAX_CV_BYTES) return json({ status: "manual", reason: "cv_too_big", company });

  const letterResult = await generateCoverLetterAction(offer.id);
  if (letterResult.status === "premium_required") return json({ status: "manual", reason: "premium_required", company });
  if (letterResult.status !== "success") return json({ status: "error", company });

  const extension = /\.docx$/i.test(profile.cv_path) ? "docx" : "pdf";
  const fullName = `${names.first} ${names.last}`;
  try {
    await sendLbaApplication({
      applicant_first_name: names.first,
      applicant_last_name: names.last,
      applicant_email: replyAddress,
      applicant_phone: phone,
      applicant_attachment_name: `CV ${fullName.replace(/[^\p{L}\p{N} -]/gu, "")}.${extension}`,
      applicant_attachment_content: `data:${cvContentType(profile.cv_path)};base64,${Buffer.from(await cv.arrayBuffer()).toString("base64")}`,
      applicant_message: letterResult.letter,
      recipient_id: offer.external_id as string,
    });
  } catch (err) {
    if (err instanceof LbaError && err.status === 429) return json({ status: "busy", company });
    console.error("auto-send: La bonne alternance a refusé la candidature", err instanceof Error ? err.message : err, { offerId: offer.id });
    return json({ status: "error", company });
  }

  await storeSentCopy(admin, {
    user_id: user.id,
    from_address: replyAddress,
    from_name: fullName,
    to_address: LBA_LABEL,
    subject: `Candidature : ${offer.title}`,
    body_text: letterResult.letter,
    offer_id: offer.id,
  });
  await logServerEvent(supabase, user.id, EVENT, { offerId: offer.id, via: "la_bonne_alternance" });

  return json({ status: "sent", company, to: LBA_LABEL, from: replyAddress, sentLast24h: await sentLast24h(admin, user.id), channel: "lba" });
}

async function applyByEmail(admin: Admin, supabase: Supabase, { request, user, offer, profile, alreadySent }: Context) {
  const company = offer.company;
  const to = recipientForOffer(offer);
  if (!to) return json({ status: "manual", reason: "no_email", company });
  if (!inboxDomain()) return json({ status: "manual", reason: "inbox_off", company });
  if (!profile.cv_path) return json({ status: "manual", reason: "no_cv", company });
  if (alreadySent) return json({ status: "manual", reason: "already_sent", company });

  if (request?.check) return json({ status: "ready", company, to, channel: "email" });

  const letterResult = await generateCoverLetterAction(offer.id);
  if (letterResult.status === "premium_required") return json({ status: "manual", reason: "premium_required", company });
  if (letterResult.status !== "success") return json({ status: "error", company });

  const fromAddress = await getOrCreateInboxAddress(admin, user.id, profile.full_name);
  if (!fromAddress) return json({ status: "manual", reason: "inbox_off", company });

  const cv = await downloadCv(admin, profile.cv_path, user.id);
  if (!cv) return json({ status: "manual", reason: "no_cv", company });
  const extension = /\.docx$/i.test(profile.cv_path) ? "docx" : "pdf";
  const name = profile.full_name?.trim() || null;
  const subject = `Candidature : ${offer.title}`;

  const { error: sendError } = await getResendClient().emails.send({
    from: name ? `${name.replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress,
    to,
    replyTo: fromAddress,
    subject,
    text: letterResult.letter,
    attachments: [
      {
        filename: name ? `CV ${name}.${extension}` : `CV.${extension}`,
        content: Buffer.from(await cv.arrayBuffer()),
        contentType: cvContentType(profile.cv_path),
      },
    ],
  });
  if (sendError) {
    console.error("auto-send: envoi en échec", sendError, { offerId: offer.id });
    return json({ status: "error", company });
  }

  await storeSentCopy(admin, {
    user_id: user.id,
    from_address: fromAddress,
    from_name: name,
    to_address: to,
    subject,
    body_text: letterResult.letter,
    offer_id: offer.id,
  });
  await logServerEvent(supabase, user.id, EVENT, { offerId: offer.id, toDomain: to.split("@")[1] });

  return json({ status: "sent", company, to, from: fromAddress, sentLast24h: await sentLast24h(admin, user.id), channel: "email" });
}
