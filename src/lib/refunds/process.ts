import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { CONTACT_EMAIL } from "@/lib/site";
import { mentionsRefund } from "@/lib/admin/refunds";

// Procédure des demandes de remboursement (30/10, Nathan) :
// 1. dès la demande, un e-mail « on traite ta demande, on te répond au plus
//    vite » (envoyé ici, automatiquement) ;
// 2. Nathan décide au cas par cas (rembourser ceux qui ont vraiment testé
//    l'outil plusieurs jours, pas ceux qui ont résilié en 24-48 h) ;
// 3. 20 jours après, sans remboursement : « on ne peut pas te rembourser, à
//    la place un mois offert », l'abonnement prolongé d'un mois dans Stripe
//    sans prélèvement, fait à la main avec l'accord de Nathan. Accès à vie :
//    Nathan décide lui-même.
// Le formulaire de la garantie garde son propre e-mail (remboursement promis
// par les CGV quand les conditions sont remplies).

type Admin = ReturnType<typeof createAdminClient>;

export const REFUND_ACK_EVENT = "refund_ack_sent";
/** Jours entre l'accusé de réception et la réponse (mois offert). */
export const REFUND_FOLLOW_UP_DAYS = 20;
const ACK_REPEAT_MS = 30 * 86_400_000;

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

/** Réponse au bout de 20 jours (envoyée à la main, avec la prolongation Stripe). */
export function renderFreeMonthEmail(fullName: string | null, untilLabel: string) {
  const first = firstName(fullName);
  const lines = [
    first ? `Salut ${first},` : "Salut,",
    "On a étudié ta demande de remboursement. Malheureusement, on ne peut pas te rembourser.",
    `À la place, on t'offre un mois de Premium : ton accès est prolongé jusqu'au ${untilLabel}, sans aucun prélèvement.`,
    "Une question ? Réponds simplement à cet e-mail.",
    "Nathan, fondateur de Stageio",
  ];
  return { subject: "Ta demande de remboursement Stageio", html: wrap(lines.map(escapeHtml)), text: lines.join("\n\n") };
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

/** Date de la réponse (mois offert) : 20 jours après l'accusé de réception. */
export function followUpAt(ackAt: number): number {
  return ackAt + REFUND_FOLLOW_UP_DAYS * 86_400_000;
}
