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

// Offre 48 h par email (Nathan, 28/10 : « l'offre de bienvenue plus […] 30
// euros accès à vie […] pendant 48 heures juste pour vous », comme l'email
// du 24/10 qui avait ramené des paiements). Le premier email de la série
// Premium reçu pendant la campagne ouvre, pour ce compte seulement, 48 h de
// prix de bienvenue (7,99 €/mois) avec l'accès à vie au prix de 30 € (le
// même prix Stripe que la promo du 23-25/10). Délai compté côté serveur
// depuis l'envoi, jamais rouvert. Ni prix barré ni « baisse de prix » : 30 €
// est déjà le prix le plus bas de l'accès à vie sur les 30 derniers jours.
export const FLASH_OFFER = {
  windowMs: 48 * 60 * 60 * 1000,
  lifetimePrice: LIFETIME_PROMO.price,
  // Emails envoyés dans cette période : ils ouvrent l'offre (dimanche 1/11 à 21 h à Paris).
  start: Date.parse("2026-10-28T17:00:00Z"),
  end: Date.parse("2026-11-01T20:00:00Z"),
};

export function isFlashCampaignOpen(now: number = Date.now()): boolean {
  return now >= FLASH_OFFER.start && now < FLASH_OFFER.end;
}

// Prix spécial de l'accès à vie montré au paywall, pendant le prix de
// bienvenue : l'offre 48 h du compte, ou la promo du 23-25/10.
export type LifetimeOffer = { kind: "flash" | "promo"; price: string; endsAt: number; strike: string | null; badge: string };

export function lifetimeOfferFor(flashEndsAt: number | null, now: number = Date.now()): LifetimeOffer | null {
  if (flashEndsAt !== null && now < flashEndsAt) {
    return { kind: "flash", price: FLASH_OFFER.lifetimePrice, endsAt: flashEndsAt, strike: null, badge: "Offre 48 h" };
  }
  if (isLifetimePromoActive(now)) {
    return { kind: "promo", price: LIFETIME_PROMO.price, endsAt: LIFETIME_PROMO.endsAt, strike: LIFETIME_PROMO.referencePrice, badge: "Promo" };
  }
  return null;
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

// Formule « Stageio Auto » (24/10, demande de Nathan) : Premium + chaque
// like envoie la candidature tout seul (jusqu'à 100 par jour, au-delà le
// like redevient un favori) + boîte mail de candidature. 17,99 €/mois ou
// 80 € à vie. Prix créés le 24/10 sur le produit Stripe « Stageio Auto »
// (clés de recherche stageio_auto_monthly_1799 / stageio_auto_lifetime_8000).
export const AUTO_PRICES = { monthly: "17,99 €", lifetime: "80 €" } as const;
export const AUTO_MONTHLY_CENTS = 1799;
export const AUTO_DAILY_LIMIT = 100;
export const AUTO_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_AUTO_MONTHLY?.trim() || "price_1UU96mRd6r34OMU6vrO0Mhln",
  lifetime: process.env.STRIPE_PRICE_ID_AUTO_LIFETIME?.trim() || "price_1UU96qRd6r34OMU6aTrAx6Ho",
};
