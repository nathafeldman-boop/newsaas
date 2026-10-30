import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { mentionsRefund } from "@/lib/admin/refunds";
import { getStripeSnapshot } from "@/lib/admin/cockpit/stripeSnapshot";

// Procédure des demandes de remboursement (30/10, Nathan) :
// 1. dès une nouvelle demande, un e-mail « on traite ta demande, on te
//    répond au plus vite » (envoyé ici, automatiquement) ;
// 2. Nathan décide au cas par cas (rembourser ceux qui ont vraiment testé
//    l'outil plusieurs jours, pas ceux qui ont résilié en 24-48 h) ;
// 3. 20 jours après, s'il n'a pas remboursé entre-temps : « on a traité ta
//    demande, on ne peut pas te rembourser (conditions des CGV), mais on te
//    propose un geste : un mois offert ou la formule supérieure ; réponds
//    pour choisir » (envoyé par le cron abonnes). Le geste est appliqué à la
//    main par Nathan à la réponse.
// Seules les nouvelles demandes déclenchent la procédure. Le formulaire de la
// garantie garde son propre e-mail (remboursement promis par les CGV quand
// les conditions sont remplies).

type Admin = ReturnType<typeof createAdminClient>;

export const REFUND_ACK_EVENT = "refund_ack_sent";
export const REFUND_FOLLOW_UP_EVENT = "refund_follow_up_sent";
/** Jours entre l'accusé de réception et la réponse (mois offert). */
export const REFUND_FOLLOW_UP_DAYS = 20;
const DAY = 86_400_000;
const ACK_REPEAT_MS = 30 * DAY;
/** Au-delà, un accusé trop ancien (cron arrêté) ne déclenche plus de réponse. */
const FOLLOW_UP_MAX_AGE_MS = 40 * DAY;

const firstName = (fullName: string | null) => fullName?.trim().split(/\s+/)[0] || null;

const wrap = (paragraphs: string[]) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">${paragraphs.map((p) => `<p>${p}</p>`).join("\n")}</div>`;

export function renderRefundAckEmail(fullName: string | null) {
  const first = firstName(fullName);
  const lines = [
    first ? `Salut ${first},` : "Salut,",
    "J'ai bien reçu ta demande de remboursement. On la traite et on te répond au plus vite.",
    "Nathan, fondateur de Stageio",
  ];
  return { subject: "On traite ta demande de remboursement", html: wrap(lines.map(escapeHtml)), text: lines.join("\n\n") };
}

/** Réponse 20 jours après l'accusé : pas de remboursement, un geste commercial au choix. */
export function renderRefundFollowUpEmail(fullName: string | null, lifetime: boolean) {
  const first = firstName(fullName);
  const cgv = `${SITE_URL}/legal/cgv`;
  const gesture = lifetime
    ? "faire passer gratuitement ton accès à vie à Stageio Auto (tes candidatures envoyées pour toi)."
    : "t'offrir un mois de Premium gratuit, ou un mois gratuit de Stageio Auto (tes candidatures envoyées pour toi).";
  const intro = [
    first ? `Salut ${first},` : "Salut,",
    "On a bien traité ta demande de remboursement. Malheureusement, on ne peut pas te rembourser pour l'instant : ta demande ne remplit pas les conditions de remboursement prévues par nos conditions générales de vente.",
  ];
  const outro = [`Par contre, on tient à te faire un geste : on peut ${gesture}`, "Réponds simplement à cet e-mail avec ton choix, et on s'en occupe.", "Nathan, fondateur de Stageio"];
  const html = wrap([
    ...intro.map(escapeHtml),
    `Les conditions sont ici : <a href="${cgv}" style="color:#0c7a44">${cgv}</a>`,
    ...outro.map(escapeHtml),
  ]);
  return { subject: "Ta demande de remboursement Stageio", html, text: [...intro, `Les conditions sont ici : ${cgv}`, ...outro].join("\n\n") };
}

type AckProfile = { id: string; email: string | null; full_name: string | null };

/**
 * Accusé de réception, une fois par compte sur 30 jours (la même demande
 * peut arriver par le portail Stripe puis par le questionnaire). Jamais
 * bloquant : renvoie l'erreur au lieu de la lever.
 */
export async function sendRefundAckOnce(db: Admin, profile: AckProfile, source: "stripe" | "questionnaire", now = Date.now()): Promise<{ sent: boolean; error: string | null }> {
  try {
    const from = campaignSender();
    if (!from || !profile.email) return { sent: false, error: from ? null : "RESEND_FROM_EMAIL manquant" };
    const { data: already, error: readError } = await db
      .from("user_events")
      .select("id")
      .eq("user_id", profile.id)
      .eq("event_type", REFUND_ACK_EVENT)
      .gte("created_at", new Date(now - ACK_REPEAT_MS).toISOString())
      .limit(1);
    if (readError) return { sent: false, error: readError.message };
    if (already?.length) return { sent: false, error: null };
    const day = new Date(now).toISOString().slice(0, 10);
    const { error } = await getResendClient().emails.send(
      { from, to: profile.email, replyTo: CONTACT_EMAIL, ...renderRefundAckEmail(profile.full_name), tags: [{ name: "campaign", value: "refund_ack" }] },
      { idempotencyKey: `refund-ack-${profile.id}-${day}` },
    );
    if (error) return { sent: false, error: error.message };
    await db.from("user_events").insert({ user_id: profile.id, event_type: REFUND_ACK_EVENT, metadata: { source } });
    return { sent: true, error: null };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Commentaire de résiliation Stripe qui demande un remboursement : accusé de
 * réception au client. Vrai si c'est une demande de remboursement (le
 * message de résiliation habituel n'est alors pas envoyé). Jamais bloquant.
 */
export async function onRefundComment(db: Admin, customerId: string, comment: string | null | undefined): Promise<boolean> {
  if (!mentionsRefund(comment)) return false;
  try {
    const { data: profile } = await db.from("profiles").select("id, email, full_name").eq("stripe_customer_id", customerId).maybeSingle();
    if (!profile) return false;
    const { error } = await sendRefundAckOnce(db, profile, "stripe");
    if (error) console.error("onRefundComment: accusé non envoyé", error, { customerId });
    return true;
  } catch (err) {
    console.error("onRefundComment: accusé non envoyé", err, { customerId });
    return false;
  }
}

/** Questionnaire de départ qui parle de remboursement : même accusé de réception. Jamais bloquant. */
export async function onRefundAnswer(db: Admin, userId: string, text: string): Promise<void> {
  if (!mentionsRefund(text)) return;
  try {
    const { data: profile } = await db.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle();
    if (!profile) return;
    const { error } = await sendRefundAckOnce(db, profile, "questionnaire");
    if (error) console.error("onRefundAnswer: accusé non envoyé", error, { userId });
  } catch (err) {
    console.error("onRefundAnswer: accusé non envoyé", err, { userId });
  }
}

/** Date de la réponse (geste commercial) : 20 jours après l'accusé de réception. */
export function followUpAt(ackAt: number): number {
  return ackAt + REFUND_FOLLOW_UP_DAYS * DAY;
}

/** La réponse est due : 20 jours passés, et l'accusé n'est pas trop ancien. */
export function followUpDue(ackAt: number, now: number): boolean {
  return now >= followUpAt(ackAt) && now - ackAt < FOLLOW_UP_MAX_AGE_MS;
}

type FollowUpProfile = { id: string; email: string | null; full_name: string | null; stripe_customer_id: string | null; subscription_status: string | null };

/**
 * Cron abonnes (10 h) : réponse aux demandes dont l'accusé a 20 jours, sauf
 * si Nathan a remboursé entre-temps (remboursement Stripe après la demande).
 * Une réponse par accusé. Sans relevé Stripe lisible, rien ne part.
 */
export async function runRefundFollowUps(db: Admin, deadline: number, now = Date.now()) {
  const summary = { due: 0, sent: 0, refunded: 0, failures: [] as string[] };
  const { data: acks, error } = await db
    .from("user_events")
    .select("user_id, created_at")
    .eq("event_type", REFUND_ACK_EVENT)
    .gte("created_at", new Date(now - FOLLOW_UP_MAX_AGE_MS).toISOString())
    .lte("created_at", new Date(now - REFUND_FOLLOW_UP_DAYS * DAY).toISOString())
    .limit(500);
  if (error) throw new Error(error.message);
  const due = (acks ?? []).filter((a) => followUpDue(Date.parse(a.created_at), now));
  if (due.length === 0) return summary;
  const ids = [...new Set(due.map((a) => a.user_id))];
  const [{ data: done, error: doneError }, { data: profiles, error: profilesError }, snap] = await Promise.all([
    db.from("user_events").select("user_id, created_at").eq("event_type", REFUND_FOLLOW_UP_EVENT).in("user_id", ids),
    db.from("profiles").select("id, email, full_name, stripe_customer_id, subscription_status").in("id", ids),
    getStripeSnapshot(),
  ]);
  if (doneError) throw new Error(doneError.message);
  if (profilesError) throw new Error(profilesError.message);
  const byId = new Map(((profiles ?? []) as FollowUpProfile[]).map((p) => [p.id, p]));
  const from = campaignSender();
  if (!from) throw new Error("RESEND_FROM_EMAIL manquant");
  for (const ack of due) {
    if (Date.now() > deadline) break;
    const ackAt = Date.parse(ack.created_at);
    if ((done ?? []).some((d) => d.user_id === ack.user_id && Date.parse(d.created_at) >= ackAt)) continue;
    const profile = byId.get(ack.user_id);
    if (!profile?.email) continue;
    summary.due++;
    const refunded = !!profile.stripe_customer_id && snap.refunds.some((r) => r.customer === profile.stripe_customer_id && r.created >= ackAt - DAY);
    if (refunded) {
      summary.refunded++;
      await db.from("user_events").insert({ user_id: profile.id, event_type: REFUND_FOLLOW_UP_EVENT, metadata: { skipped: "refunded" } });
      continue;
    }
    const lifetime = profile.subscription_status === "lifetime";
    const { error: sendError } = await getResendClient().emails.send(
      { from, to: profile.email, replyTo: CONTACT_EMAIL, ...renderRefundFollowUpEmail(profile.full_name, lifetime), tags: [{ name: "campaign", value: "refund_follow_up" }] },
      { idempotencyKey: `refund-follow-up-${profile.id}-${ackAt}` },
    );
    if (sendError) {
      summary.failures.push(`${profile.id}: ${sendError.message}`);
      continue;
    }
    await db.from("user_events").insert({ user_id: profile.id, event_type: REFUND_FOLLOW_UP_EVENT, metadata: { lifetime } });
    summary.sent++;
  }
  return summary;
}
