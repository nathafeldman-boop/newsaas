// Garantie « pas d'entretien en 2 mois = remboursé » (Nathan, 20/10 ; 2 mois
// au lieu de 3 depuis le 22/10) :
// proposée uniquement à ceux qui l'ont vue sur /premium -- 3e écran avant le
// paywall (21/10) ou message en quittant le paywall -- (événement
// refund_guarantee_offered), sur n'importe quelle formule
// souscrite ensuite. Conditions écrites dans les CGV (section « Garantie »)
// et rappelées sur chaque écran qui en parle : la fenêtre de demande est
// courte (12 h, choix de Nathan), donc ses dates exactes sont affichées dans
// l'app dès l'achat et un email de rappel part la veille (cron
// refund-guarantee-reminder). Remboursement fait à la main dans Stripe.
// Module sans dépendance serveur : importé aussi par les composants client.
export const GUARANTEE_MONTHS = 2;

// Garantie 48 h (26/11, Nathan : « si en 48 heures t'as pas d'entretien, on te
// rembourse […] pour en savoir plus, vous allez dans les conditions
// générales »). Remplace la garantie « 2 mois » pour les achats faits à partir
// de NEW_GUARANTEE_START (ceux d'avant gardent la leur). Toutes les formules.
// Conditions (choix de Nathan, version « plus exigeante ») écrites dans les
// CGV, section « Garantie » ; « sous conditions » toujours visible à côté.
export const NEW_GUARANTEE_START = Date.parse("2026-11-26T15:32:00Z");
export const GUARANTEE_48H_HOURS = 48;
export const GUARANTEE_48H_APPLICATIONS = 40;
export const GUARANTEE_48H_REQUEST_DAYS = 3;
export const GUARANTEE_48H = {
  title: "Pas d'entretien en 48 h ? On te rembourse intégralement.",
  subtitle: "Garantie 48 h",
  hook: `Tu envoies au moins ${GUARANTEE_48H_APPLICATIONS} candidatures avec Stageio dans les 48 h qui suivent ton paiement et tu n'obtiens aucun entretien : on te rembourse la totalité.`,
  mention: "Sous conditions",
  link: "/legal/cgv#garantie",
};
export const GUARANTEE_48H_CONDITIONS =
  `au moins ${GUARANTEE_48H_APPLICATIONS} candidatures envoyées avec Stageio dans les ${GUARANTEE_48H_HOURS} h qui suivent ton premier paiement ` +
  `(avec une capture de l'envoi pour celles faites sur le site du recruteur), profil et CV complétés, aucun entretien obtenu, ` +
  `demande par email dans les ${GUARANTEE_48H_REQUEST_DAYS} jours suivant le paiement, sans avoir résilié avant.`;

/** L'achat relève-t-il de la garantie 48 h (achats à partir du 26/11) ? */
export function isNewGuaranteePurchase(activatedAt: string | null): boolean {
  return !!activatedAt && Date.parse(activatedAt) >= NEW_GUARANTEE_START;
}
/**
 * Accès à vie achetés à partir de cette date : pas de garantie ni de
 * remboursement (Nathan, 30/10 ; CGV, section « Garantie »). Ceux achetés
 * avant restent couverts.
 */
export const LIFETIME_GUARANTEE_END = Date.parse("2026-10-31T00:00:00+01:00");

/** Cet achat ouvre-t-il droit à la garantie (hors accès à vie récents) ? */
export function guaranteeCoversPurchase(subscriptionStatus: string | null, activatedAt: string): boolean {
  return subscriptionStatus !== "lifetime" || Date.parse(activatedAt) < LIFETIME_GUARANTEE_END;
}
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

export const GUARANTEE_CONDITIONS =
  `${GUARANTEE_MONTHS} mois de Premium sans interruption (ou accès à vie), au moins ${GUARANTEE_MIN_LIKES} offres likées pendant ces ${GUARANTEE_MONTHS} mois, ` +
  `aucun entretien obtenu, et demande depuis ta page Premium dans les ${GUARANTEE_WINDOW_HOURS} h qui suivent tes ${GUARANTEE_MONTHS} mois ` +
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
