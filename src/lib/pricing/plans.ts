// Tarifs Stageio (20/10, décision de Nathan) : prix réguliers 12,79 €/mois et
// 63,99 € à vie (+60 %). Prix de bienvenue (les anciens prix, 7,99 € et
// 39,99 €) pendant 10 minutes (20 jusqu'au 22/10) à compter de la première fois où la personne
// voit la page Premium -- un vrai délai, compté côté serveur, qui ne repart
// jamais à zéro. Ni « −X % » ni prix barré : en France une réduction se
// calcule depuis le prix le plus bas des 30 derniers jours (7,99 €), donc
// on affiche le prix de bienvenue, le temps restant et le prix d'après.
// Fichier sans import serveur : lu aussi par le paywall (composant client).

export const WELCOME_WINDOW_MS = 10 * 60 * 1000;

// Promo sur l'accès à vie (Nathan, nuit du 22 au 23/10) : pendant 48 h,
// jusqu'au dimanche 25/10 à 0 h 30 (Paris), le prix de bienvenue de l'accès
// à vie passe de 39,99 € à 30 €, toujours avec le chrono de 10 min (ensuite
// 63,99 €). Affichée « Promo » avec 39,99 € barré, sans parler des 48 h
// (choix de Nathan). Prix barré légal : 39,99 € est bien le prix le plus bas
// de l'accès à vie sur les 30 jours d'avant (vérifié dans Stripe le 23/10).
export const LIFETIME_PROMO = {
  price: "30 €",
  referencePrice: "39,99 €",
  endsAt: Date.parse("2026-10-24T22:30:00Z"),
  priceId: process.env.STRIPE_PRICE_ID_LIFETIME_PROMO?.trim() || "price_1UTUL8Rd6r34OMU6yx7sViTI",
};

// Lu hors du rendu (page serveur, action de paiement) : l'heure courante.
export function isLifetimePromoActive(now: number = Date.now()): boolean {
  return now < LIFETIME_PROMO.endsAt;
}

export const PLAN_PRICES = {
  monthly: { welcome: "7,99 €", regular: "12,79 €" },
  lifetime: { welcome: "39,99 €", regular: "63,99 €" },
} as const;

// Prix Stripe réguliers (créés le 20/10 sur le compte Stripe, clés de
// recherche stageio_premium_monthly_1279 / stageio_premium_lifetime_6399).
// Les prix de bienvenue restent STRIPE_PRICE_ID / STRIPE_PRICE_ID_LIFETIME.
export const REGULAR_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_REGULAR?.trim() || "price_1USaRfRd6r34OMU6D3mrspqO",
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME_REGULAR?.trim() || "price_1USaRjRd6r34OMU6JhNZAkDw",
};
