// Garantie « pas d'entretien en 3 mois = remboursé » (Nathan, 20/10) :
// proposée uniquement à ceux qui l'ont vue sur /premium -- 3e écran avant le
// paywall (21/10) ou message en quittant le paywall -- (événement
// refund_guarantee_offered), sur n'importe quelle formule
// souscrite ensuite. Conditions écrites dans les CGV (section « Garantie »)
// et rappelées sur chaque écran qui en parle : la fenêtre de demande est
// courte (12 h, choix de Nathan), donc ses dates exactes sont affichées dans
// l'app dès l'achat et un email de rappel part la veille (cron
// refund-guarantee-reminder). Remboursement fait à la main dans Stripe.
// Module sans dépendance serveur : importé aussi par les composants client.
export const GUARANTEE_MONTHS = 3;
export const GUARANTEE_WINDOW_HOURS = 12;
export const GUARANTEE_MIN_LIKES = 50;
export const GUARANTEE_REFUND_DAYS = 14;

export const GUARANTEE_OFFERED_EVENT = "refund_guarantee_offered";
export const GUARANTEE_REQUESTED_EVENT = "refund_requested";
export const GUARANTEE_REMINDED_EVENT = "refund_reminder_sent";

// Cookie posé par le navigateur à l'affichage du message de sortie : sert
// seulement à montrer le badge « garantie activée » sur le paywall sans
// requête en base. Le droit à la garantie, lui, vient de l'événement.
export const GUARANTEE_COOKIE = "stageio_guarantee";
// Engagement signé (empreinte) : l'écran ne repasse plus avant le paywall.
export const PLEDGE_COOKIE = "stageio_pledge";

export const GUARANTEE_CONDITIONS =
  `3 mois de Premium sans interruption (ou accès à vie), au moins ${GUARANTEE_MIN_LIKES} offres likées pendant ces 3 mois, ` +
  `aucun entretien obtenu, et demande depuis ta page Premium dans les ${GUARANTEE_WINDOW_HOURS} h qui suivent tes 3 mois ` +
  `(dates exactes affichées dans l'app, rappel par email la veille).`;

export function guaranteeWindow(activatedAt: string): { opensAt: Date; closesAt: Date } {
  const opensAt = new Date(activatedAt);
  opensAt.setMonth(opensAt.getMonth() + GUARANTEE_MONTHS);
  return { opensAt, closesAt: new Date(opensAt.getTime() + GUARANTEE_WINDOW_HOURS * 3600 * 1000) };
}

export function formatParis(date: Date): string {
  return date.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function setBrowserCookie(name: string) {
  document.cookie = `${name}=1; path=/; max-age=31536000; samesite=lax`;
}
