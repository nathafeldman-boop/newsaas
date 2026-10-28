import { offerPath } from "@/lib/offers/publicUrl";
import { SITE_URL } from "@/lib/site";
import { unsubscribeFooterHtml } from "@/lib/resend/unsubscribe";
import type { Offer } from "@/types/database";

// Alerte « nouvelles offres pour toi » (refaite le 24/10, mission churn) :
// contenu de l'e-mail et règles de fréquence, sans accès base (testable).
// L'envoi est dans api/cron/notify-new-offers.

export type AlertFrequency = "daily" | "weekly";
export const ALERT_SENT_EVENT = "offer_alert_sent";
export const ALERT_TAG = "offer_alert";
export const MAX_OFFERS_PER_EMAIL = 5;
/** Plafond par défaut d'e-mails d'alerte par 24 h (OFFER_ALERTS_DAILY_CAP dans Vercel pour le changer). */
export const DEFAULT_DAILY_CAP = 300;

const DAY_MS = 86_400_000;

export function alertFrequency(value: unknown): AlertFrequency {
  return value === "weekly" ? "weekly" : "daily";
}

/**
 * Le compte est-il dû ? Quotidien : pas traité depuis 20 h (plusieurs
 * passages le même matin ne renvoient rien). Hebdomadaire : pas depuis
 * 7 jours moins 2 h de marge.
 */
export function isDue(lastProcessedAt: string | null, frequency: AlertFrequency, now: number): boolean {
  if (!lastProcessedAt) return true;
  const elapsed = now - Date.parse(lastProcessedAt);
  return frequency === "weekly" ? elapsed >= 7 * DAY_MS - 2 * 3600_000 : elapsed >= 20 * 3600_000;
}

/** Fenêtre des offres à annoncer : arrivées depuis le dernier passage (24 h la première fois, 8 jours au plus). */
export function windowStart(lastProcessedAt: string | null, now: number): string {
  const floor = now - 8 * DAY_MS;
  const from = lastProcessedAt ? Math.max(Date.parse(lastProcessedAt), floor) : now - DAY_MS;
  return new Date(from).toISOString();
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const utm = (content: string) => `utm_source=email&utm_medium=alerte&utm_campaign=offres&utm_content=${content}`;

type Match = { offer: Pick<Offer, "id" | "title" | "company" | "location" | "contract_type">; score: number };

// Abonnés (28/10, résumé du matin) : leurs résultats des dernières 24 h
// (vrais comptes) et le lien vers les candidatures spontanées.
export type AlertRecap = { sent: number; replies: number };

export function renderOfferAlert(params: { profileId: string; firstName: string | null; matches: Match[]; frequency: AlertFrequency; recap?: AlertRecap }): {
  subject: string;
  html: string;
  text: string;
} {
  const { matches, frequency } = params;
  const n = matches.length;
  const period = frequency === "weekly" ? "cette semaine" : "depuis hier";
  const subject = n === 1 ? `1 nouvelle offre pour toi ${period} 👀` : `${n} nouvelles offres pour toi ${period} 👀`;
  const hello = params.firstName?.trim() ? `Salut ${escapeHtml(params.firstName.trim())},` : "Salut,";
  const contract = (c: string) => (c === "alternance" ? "Alternance" : "Stage");

  const items = matches
    .map(({ offer, score }) => {
      const url = `${SITE_URL}${offerPath(offer)}?${utm("offre")}`;
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">
<a href="${url}" style="font-weight:700;color:#0f7a45;text-decoration:none">${escapeHtml(offer.title)}</a><br>
<span style="font-size:13px;color:#555">${escapeHtml(offer.company)} · ${escapeHtml(offer.location)} · ${contract(offer.contract_type)} · ${score} % compatible</span>
</td></tr>`;
    })
    .join("");

  const swipeUrl = `${SITE_URL}/swipe?${utm("bouton")}`;
  const settingsUrl = `${SITE_URL}/profil?${utm("frequence")}`;
  const rhythm = frequency === "weekly" ? "une fois par semaine" : "au plus une fois par jour";
  const recap = params.recap;
  const recapLine =
    recap && recap.sent + recap.replies > 0
      ? `📈 Depuis hier : ${recap.sent} candidature${recap.sent > 1 ? "s" : ""} envoyée${recap.sent > 1 ? "s" : ""}, ${recap.replies} réponse${recap.replies > 1 ? "s" : ""} reçue${recap.replies > 1 ? "s" : ""}.`
      : null;
  const spontaneousUrl = `${SITE_URL}/spontanees?${utm("spontanees")}`;
  const html = `<p>${hello}</p>
${recapLine ? `<p style="background:#f2fbf6;border-radius:10px;padding:10px 12px">${recapLine}</p>` : ""}
<p>${n === 1 ? "Une offre arrivée" : `${n} offres arrivées`} sur Stageio ${period} correspond${n === 1 ? "" : "ent"} à ton profil. Les premiers à postuler ont le plus de chances.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px">${items}</table>
<p style="margin-top:18px"><a href="${swipeUrl}" style="background:#0f9c56;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:700">Voir toutes mes offres</a></p>
${recap ? `<p>🏢 Des entreprises près de chez toi recrutent aussi sans annonce : <a href="${spontaneousUrl}" style="color:#0f7a45;font-weight:700">candidature spontanée en 1 clic</a>.</p>` : ""}
<p style="font-size:12px;color:#888">Tu reçois cette alerte ${rhythm}, seulement s'il y a des offres pour toi. <a href="${settingsUrl}" style="color:#888">Changer la fréquence</a>.</p>
${unsubscribeFooterHtml(params.profileId)}`;

  const text = [
    params.firstName?.trim() ? `Salut ${params.firstName.trim()},` : "Salut,",
    "",
    ...(recapLine ? [recapLine, ""] : []),
    `${n === 1 ? "Une offre arrivée" : `${n} offres arrivées`} sur Stageio ${period} correspond${n === 1 ? "" : "ent"} à ton profil :`,
    "",
    ...matches.map(({ offer, score }) => `- ${offer.title} — ${offer.company} (${offer.location}), ${score} % compatible : ${SITE_URL}${offerPath(offer)}?${utm("offre")}`),
    "",
    `Voir toutes mes offres : ${swipeUrl}`,
    ...(recap ? [`Candidature spontanée en 1 clic : ${spontaneousUrl}`] : []),
    `Changer la fréquence : ${settingsUrl}`,
  ].join("\n");

  return { subject, html, text };
}
