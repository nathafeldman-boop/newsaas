import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { recipientForOffer } from "@/lib/offers/recruiterEmail";
import { getOrCreateInboxAddress, inboxDomain } from "@/lib/inbox/address";
import { getResendClient } from "@/lib/resend/client";
import { generateCoverLetterAction } from "@/app/(app)/candidature/[offerId]/actions";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import type { AutoSendResult } from "@/lib/applications/autoSend";

// Like = candidature envoyée : quand l'entreprise a publié un email, la
// lettre écrite pour l'offre part de l'adresse Stageio de l'étudiant (sa
// boîte intégrée, voir lib/inbox/address.ts), avec son CV en pièce jointe ;
// la réponse du recruteur arrive dans /boite. Depuis le 15/10 : plus besoin
// de connecter Gmail. Sinon (« manual »), la page de candidature s'ouvre.
// Route plutôt que server action : les server actions d'un même onglet
// passent l'une après l'autre, et un envoi (lettre + email) prend 10 à 30 s
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
  const [{ data: offer }, { data: profile }, { data: alreadySent }] = await Promise.all([
    supabase.from("offers").select("*").eq("id", offerId).maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, cv_path, subscription_status, current_period_end")
      .eq("id", user.id)
      .maybeSingle(),
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
  if (!isPremium(profile)) return json({ status: "manual", reason: "premium_required", company });

  const to = recipientForOffer(offer);
  if (!to) return json({ status: "manual", reason: "no_email", company });
  if (!inboxDomain()) return json({ status: "manual", reason: "inbox_off", company });
  if (!profile?.cv_path) return json({ status: "manual", reason: "no_cv", company });
  if ((alreadySent ?? []).length > 0) return json({ status: "manual", reason: "already_sent", company });

  if (body?.check) return json({ status: "ready", company, to });

  const letterResult = await generateCoverLetterAction(offerId);
  if (letterResult.status === "premium_required") return json({ status: "manual", reason: "premium_required", company });
  if (letterResult.status !== "success") return json({ status: "error", company });

  const fromAddress = await getOrCreateInboxAddress(admin, user.id, profile.full_name);
  if (!fromAddress) return json({ status: "manual", reason: "inbox_off", company });

  const { data: cvFile, error: cvError } = await admin.storage.from("cvs").download(profile.cv_path);
  if (cvError || !cvFile) {
    console.error("auto-send: CV introuvable", cvError, { userId: user.id });
    return json({ status: "manual", reason: "no_cv", company });
  }
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
        content: Buffer.from(await cvFile.arrayBuffer()),
        contentType: cvContentType(profile.cv_path),
      },
    ],
  });
  if (sendError) {
    console.error("auto-send: envoi en échec", sendError, { offerId });
    return json({ status: "error", company });
  }

  // Copie dans la boîte (onglet « envoyés ») : sert aussi à rattacher la
  // réponse du recruteur à cette candidature (voir api/inbox/webhook).
  const { error: copyError } = await admin.from("inbox_messages").insert({
    user_id: user.id,
    direction: "out",
    from_address: fromAddress,
    from_name: name,
    to_address: to,
    subject,
    body_text: letterResult.letter,
    offer_id: offerId,
    read_at: new Date().toISOString(),
  });
  if (copyError) console.error("auto-send: copie dans la boîte impossible", copyError);

  await logServerEvent(supabase, user.id, EVENT, { offerId, toDomain: to.split("@")[1] });

  const { count } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", EVENT)
    .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());

  return json({ status: "sent", company, to, from: fromAddress, sentLast24h: count ?? 1 });
}
