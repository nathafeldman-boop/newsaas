import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { recipientForOffer } from "@/lib/offers/recruiterEmail";
import { getOrCreateInboxAddress, inboxDomain } from "@/lib/inbox/address";
import { studentSender } from "@/lib/inbox/sender";
import { getResendClient } from "@/lib/resend/client";
import { generateTailoredLetter } from "@/lib/coverLetter/tailoredLetter";
import { countPlaceholders } from "@/lib/coverLetter/templates";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { LbaError, lbaApiKey, MAX_CV_BYTES, sendLbaApplication } from "@/lib/laBonneAlternance/client";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import { AUTO_PACE_LIMIT, AUTO_PACE_WINDOW_MS, autoPace, LBA_LABEL, parisMidnightIso, type AutoSendResult } from "@/lib/applications/autoSend";
import { FOLLOW_UP_DAYS, isMissingColumnError } from "@/lib/applications/status";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import type { Application, Offer, Profile } from "@/types/database";

// Formule « Stageio Auto » (24/10, demande de Nathan ; reprise du code
// retiré le 16/10) : un like envoie la candidature, jusqu'à 100 par jour
// (heure de Paris). Au-delà, ou si l'offre ne le permet pas, le like reste
// un favori. Deux chemins :
// - « lba » : offre La bonne alternance. Le service public transmet lui-même
//   la candidature au recruteur (gratuit) ; la réponse arrive dans la boîte
//   Stageio de l'étudiant (ou sur son email).
// - « email » : l'entreprise a publié une adresse ; lettre et CV partent de
//   l'adresse de candidature de l'étudiant (candidat.stageio.fr).
// La lettre : celle que l'étudiant a déjà préparée pour l'offre, sinon le
// générateur statique (aucun appel IA : 100 lettres par jour et par abonné
// coûteraient plus que l'abonnement).
// Route plutôt que server action : les server actions d'un même onglet
// passent l'une après l'autre ; l'étudiant doit pouvoir continuer à swiper.
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
  return /\.docx$/i.test(path) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
}

type Admin = ReturnType<typeof createAdminClient>;
type Supabase = Awaited<ReturnType<typeof createClient>>;

async function sentToday(admin: Admin, userId: string): Promise<number> {
  const { count } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", EVENT)
    .gte("created_at", parisMidnightIso(Date.now()));
  return count ?? 0;
}

// Envois automatiques des 4 dernières heures (les 25 derniers suffisent) :
// pause de sécurité, voir autoPace.
async function recentSendTimes(admin: Admin, userId: string, now: number): Promise<number[]> {
  const { data } = await admin
    .from("user_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("event_type", EVENT)
    .gt("created_at", new Date(now - AUTO_PACE_WINDOW_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(AUTO_PACE_LIMIT);
  return (data ?? []).map((row) => Date.parse(row.created_at));
}

// Pause jusqu'à cette heure (ISO) si `times` (plus l'envoi qui vient de partir) atteint la limite.
function pausedUntilIso(times: number[], now: number): string | undefined {
  const resume = autoPace([...times, now], now);
  return resume === null ? undefined : new Date(resume).toISOString();
}

// Copie dans la boîte (onglet « envoyés ») : sert aussi à rattacher la
// réponse du recruteur à cette candidature (voir lib/inbox/receive.ts).
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

// Candidature notée « envoyée » dans le suivi, avec la lettre, la date
// d'envoi et une relance à 7 jours ; repli sur les colonnes d'origine si
// le SQL du 24/10 n'est pas passé.
async function recordSent(supabase: Supabase, userId: string, offerId: string, letter: string, existing: Application | null) {
  const now = Date.now();
  const full: Partial<Application> = {
    status: "envoyee",
    cover_note: letter,
    sent_at: new Date(now).toISOString(),
    follow_up_at: new Date(now + FOLLOW_UP_DAYS * 86_400_000).toISOString(),
  };
  const write = (patch: Partial<Application>) =>
    existing
      ? supabase.from("applications").update(patch).eq("id", existing.id).eq("user_id", userId)
      : supabase.from("applications").insert({ ...patch, user_id: userId, offer_id: offerId });
  let { error } = await write(full);
  if (error && isMissingColumnError(error)) ({ error } = await write({ status: "envoyee", cover_note: letter }));
  if (error) console.error("auto-send: candidature non notée dans le suivi", error.message, { offerId });
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
  // select("*") : phone, inbox_address et premium_tier sont des colonnes
  // ajoutées à la main, une liste explicite casserait tout tant qu'elles manquent.
  const now = Date.now();
  const [{ data: offer }, { data: profile }, { data: alreadySent }, { data: application }, count, recent] = await Promise.all([
    supabase.from("offers").select("*").eq("id", offerId).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("user_events").select("id").eq("user_id", user.id).eq("event_type", EVENT).contains("metadata", { offerId }).limit(1),
    supabase.from("applications").select("*").eq("user_id", user.id).eq("offer_id", offerId).maybeSingle(),
    sentToday(admin, user.id),
    recentSendTimes(admin, user.id, now),
  ]);

  if (!offer) return json({ status: "manual", reason: "not_found" });
  const company = offer.company;
  if (!profile || !isAutoTier(profile)) return json({ status: "manual", reason: "auto_required", company });
  if ((alreadySent ?? []).length > 0 || (application && application.status !== "a_preparer" && application.status !== "envoyee")) {
    return json({ status: "manual", reason: "already_sent", company });
  }
  if (count >= AUTO_DAILY_LIMIT) return json({ status: "manual", reason: "daily_limit", company, sentToday: count, limit: AUTO_DAILY_LIMIT });
  // 25 envois en moins de 4 h : pause de sécurité (autoPace). Le like reste un favori.
  const resumeAt = autoPace(recent, now);
  if (resumeAt !== null) {
    return json({ status: "manual", reason: "pace_pause", company, sentToday: count, limit: AUTO_DAILY_LIMIT, resumeAt: new Date(resumeAt).toISOString() });
  }

  const context: Context = { request: body, user: { id: user.id, email: user.email ?? null }, offer, profile, application: application ?? null, count, recent };
  if (offer.source === "la_bonne_alternance" && offer.external_id) return applyViaLba(admin, supabase, context);
  return applyByEmail(admin, supabase, context);
}

// Le 25e envoi en moins de 4 h prévient tout de suite (sans attendre le like
// suivant), et laisse une trace pour l'admin.
async function pauseAfterSend(supabase: Supabase, userId: string, recent: number[]): Promise<string | undefined> {
  const pausedUntil = pausedUntilIso(recent, Date.now());
  if (pausedUntil) await logServerEvent(supabase, userId, "auto_send_paused", { until: pausedUntil, limit: AUTO_PACE_LIMIT });
  return pausedUntil;
}

type Context = {
  request: { offerId?: string; check?: boolean } | null;
  user: { id: string; email: string | null };
  offer: Offer;
  profile: Profile;
  application: Application | null;
  count: number;
  // Heures (ms) des envois automatiques des 4 dernières heures.
  recent: number[];
};

// Lettre envoyée telle quelle : celle que l'étudiant a écrite pour cette
// offre, sauf si elle contient encore des passages à compléter (« [ta
// formation] »…) ; sinon la lettre sur mesure sans crochets (31/10).
function letterFor({ offer, profile, application }: Context): string {
  const saved = application?.cover_note?.trim();
  if (saved && countPlaceholders(saved) === 0) return saved;
  return generateTailoredLetter(offer, profile, { style: "classique", mode: "auto" });
}

async function applyViaLba(admin: Admin, supabase: Supabase, context: Context) {
  const { request, user, offer, profile, count } = context;
  const company = offer.company;
  if (!lbaApiKey()) return json({ status: "manual", reason: "lba_off", company });
  if (!profile.cv_path) return json({ status: "manual", reason: "no_cv", company });
  const names = splitFullName(profile.full_name);
  if (!names) return json({ status: "manual", reason: "no_name", company });
  const phone = normalizePhone(profile.phone);
  if (!phone) return json({ status: "manual", reason: "no_phone", company });

  if (request?.check) return json({ status: "ready", company, to: LBA_LABEL, channel: "lba", sentToday: count, limit: AUTO_DAILY_LIMIT });

  // Réponse du recruteur : dans la boîte Stageio si elle est active, sinon
  // sur l'email du compte.
  const replyAddress = (inboxDomain() && (await getOrCreateInboxAddress(admin, user.id, profile.full_name))) || user.email;
  if (!replyAddress) return json({ status: "error", company });

  const cv = await downloadCv(admin, profile.cv_path, user.id);
  if (!cv) return json({ status: "manual", reason: "no_cv", company });
  if (cv.size > MAX_CV_BYTES) return json({ status: "manual", reason: "cv_too_big", company });

  const letter = letterFor(context);
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
      applicant_message: letter,
      recipient_id: offer.external_id as string,
    });
  } catch (err) {
    if (err instanceof LbaError && err.status === 429) return json({ status: "busy", company });
    console.error("auto-send: La bonne alternance a refusé la candidature", err instanceof Error ? err.message : err, { offerId: offer.id });
    return json({ status: "error", company });
  }

  await logServerEvent(supabase, user.id, EVENT, { offerId: offer.id, via: "la_bonne_alternance" });
  await recordSent(supabase, user.id, offer.id, letter, context.application);
  await storeSentCopy(admin, {
    user_id: user.id,
    from_address: replyAddress,
    from_name: fullName,
    to_address: LBA_LABEL,
    subject: `Candidature : ${offer.title}`,
    body_text: letter,
    offer_id: offer.id,
  });

  return json({
    status: "sent",
    company,
    to: LBA_LABEL,
    from: replyAddress,
    sentToday: count + 1,
    limit: AUTO_DAILY_LIMIT,
    channel: "lba",
    pausedUntil: await pauseAfterSend(supabase, user.id, context.recent),
  });
}

async function applyByEmail(admin: Admin, supabase: Supabase, context: Context) {
  const { request, user, offer, profile, count } = context;
  const company = offer.company;
  const to = recipientForOffer(offer);
  if (!to) return json({ status: "manual", reason: "no_email", company });
  if (!inboxDomain()) return json({ status: "manual", reason: "inbox_off", company });
  if (!profile.cv_path) return json({ status: "manual", reason: "no_cv", company });

  if (request?.check) return json({ status: "ready", company, to, channel: "email", sentToday: count, limit: AUTO_DAILY_LIMIT });

  const fromAddress = await getOrCreateInboxAddress(admin, user.id, profile.full_name);
  if (!fromAddress) return json({ status: "manual", reason: "inbox_off", company });

  const cv = await downloadCv(admin, profile.cv_path, user.id);
  if (!cv) return json({ status: "manual", reason: "no_cv", company });
  const letter = letterFor(context);
  const extension = /\.docx$/i.test(profile.cv_path) ? "docx" : "pdf";
  const name = profile.full_name?.trim() || null;
  const subject = `Candidature ${offer.contract_type === "alternance" ? "en alternance" : "de stage"} : ${offer.title}`;
  // Transparence pour le recruteur : la candidature passe par Stageio, à la
  // demande de l'étudiant ; répondre à ce message le joint directement.
  const text = `${letter}\n\n--\nCandidature envoyée par ${name ?? "le candidat"} via Stageio (stageio.fr). Répondez directement à ce message pour le joindre.`;

  const { error: sendError } = await getResendClient().emails.send(
    {
      ...studentSender(name, fromAddress),
      to,
      subject,
      text,
      tags: [{ name: "campaign", value: "application" }],
      attachments: [
        {
          filename: name ? `CV ${name}.${extension}` : `CV.${extension}`,
          content: Buffer.from(await cv.arrayBuffer()),
          contentType: cvContentType(profile.cv_path),
        },
      ],
    },
    { idempotencyKey: `application-${user.id}-${offer.id}` },
  );
  if (sendError) {
    console.error("auto-send: envoi en échec", sendError, { offerId: offer.id });
    return json({ status: "error", company });
  }

  await logServerEvent(supabase, user.id, EVENT, { offerId: offer.id, toDomain: to.split("@")[1] });
  await recordSent(supabase, user.id, offer.id, letter, context.application);
  await storeSentCopy(admin, {
    user_id: user.id,
    from_address: fromAddress,
    from_name: name,
    to_address: to,
    subject,
    body_text: text,
    offer_id: offer.id,
  });

  return json({
    status: "sent",
    company,
    to,
    from: fromAddress,
    sentToday: count + 1,
    limit: AUTO_DAILY_LIMIT,
    channel: "email",
    pausedUntil: await pauseAfterSend(supabase, user.id, context.recent),
  });
}
