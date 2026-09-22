// Retrait planifié de la formule quotidienne (demande Nathan du 22/09, 24h
// après confirmation) -- horodatage FIXE (pas un "+24h" recalculé à chaque
// requête, qui ne compterait jamais à rebours). Source de vérité unique,
// partagée entre la page /premium (affichage de la carte + countdown) et
// createCheckoutSessionAction (refus du checkout "daily" une fois passé) :
// dupliquer cette date dans les deux fichiers risquerait de les faire
// diverger. Ne pas modifier sans consigne explicite.
export const DAILY_OFFER_DEADLINE = "2026-09-23T15:42:00.000Z";

// Fonction utilitaire à part (pas d'appel direct à Date.now() dans le corps
// d'un composant) : le linter (règles "pureté" de React Compiler) refuse un
// appel de fonction impure directement dans un Server Component, même si
// celui-ci s'exécute une seule fois par requête -- même pattern que
// daysSince() dans admin/premium/page.tsx.
export function isDailyOfferActive(): boolean {
  return Date.now() < new Date(DAILY_OFFER_DEADLINE).getTime();
}
