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
// prix de bienvenue (7,99 €/mois, 9,99 € pour une offre ouverte depuis le
// test de prix du 29/10) avec l'accès à vie au prix de 30 € (le
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

// Test de prix n°1 (Nathan, nuit du 28 au 29/10 : « le prix de base à
// 7,99 €, tu l'augmentes à 10 € [...] ou 9,99 € [...] c'est le prix de
// bienvenue, après tu l'augmentes à plus de 60 % [...] pareil pour celui à
// 17,99 € [...] et son accès à vie à 80 € » ; 2 jours, puis il garde ou
// revient aux anciens prix). Mensuel Premium : 9,99 € de bienvenue, 15,99 €
// ensuite (+60 %). Stageio Auto : 17,99 €/mois et 80 € à vie deviennent les
// prix de bienvenue (mêmes 10 minutes), ensuite 28,79 €/mois et 128 € à vie
// (+60 %). L'accès à vie Premium ne change pas. Les abonnements déjà en
// cours gardent leur prix (Stripe ne touche jamais à un abonnement existant).
// Offres déjà ouvertes avant le début (offre 48 h par email, chrono de
// 10 minutes) : tenues à 7,99 €/mois jusqu'à leur fin (voir isLegacyOffer).
// Suivi : onglet Tests de l'admin (lib/pricing/tests.ts).
export const PRICE_TEST_START = Date.parse("2026-10-29T00:00:00Z");

export const PLAN_PRICES = {
  monthly: { welcome: "9,99 €", regular: "15,99 €" },
  lifetime: { welcome: "39,99 €", regular: "63,99 €" },
} as const;

/** « 39,99 € à vie ou 9,99 €/mois » : rappel du prix dans les écrans réservés à Premium. */
export const PREMIUM_PRICE_LINE = `${PLAN_PRICES.lifetime.welcome} à vie ou ${PLAN_PRICES.monthly.welcome}/mois`;

// Prix de bienvenue mensuel d'avant le test (7,99 €, STRIPE_PRICE_ID) : pour
// les offres ouvertes avant le début du test.
export const PREVIOUS_MONTHLY_WELCOME = {
  price: "7,99 €",
  priceId: process.env.STRIPE_PRICE_ID?.trim() || "price_1UBI7gRd6r34OMU6p4OwQ4tB",
};

// Prix Stripe (identifiants écrits ici, jamais lus d'une variable : une
// ancienne variable Vercel ne peut pas les remplacer). Créés le 29/10 sur
// les produits Stageio Premium et Stageio Auto (clés de recherche
// stageio_premium_monthly_999 / _1599, stageio_auto_monthly_2879,
// stageio_auto_lifetime_12800). L'accès à vie Premium de bienvenue reste
// STRIPE_PRICE_ID_LIFETIME (39,99 €).
export const WELCOME_PRICE_IDS = {
  monthly: "price_1UVgQ8Rd6r34OMU6ryHQt9VZ",
};

export const REGULAR_PRICE_IDS = {
  monthly: "price_1UTNd7Rd6r34OMU6HWEXPWsr",
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME_REGULAR?.trim() || "price_1USaRjRd6r34OMU6JhNZAkDw",
};

// Prix d'avant le test, toujours reconnus (abonnements déjà en cours,
// commissions des affiliés, statistiques) : 12,79 €/mois (20/10).
export const PREVIOUS_REGULAR_MONTHLY_PRICE_ID = process.env.STRIPE_PRICE_ID_REGULAR?.trim() || "price_1USaRfRd6r34OMU6D3mrspqO";

/** Tous les prix du mensuel Premium, anciens compris. */
export function premiumMonthlyPriceIds(): string[] {
  return [PREVIOUS_MONTHLY_WELCOME.priceId, WELCOME_PRICE_IDS.monthly, PREVIOUS_REGULAR_MONTHLY_PRICE_ID, REGULAR_PRICE_IDS.monthly];
}

// Offre ouverte avant le début du test (offre 48 h reçue par email, ou
// chrono de 10 minutes lancé juste avant) : son prix mensuel de bienvenue
// reste celui annoncé, 7,99 €. windowStart : début de l'offre en cours.
export function isLegacyOffer(windowStart: number | null): boolean {
  return windowStart !== null && windowStart < PRICE_TEST_START;
}

// Début de l'offre en cours au moment `now` (offre 48 h d'abord, sinon
// chrono de 10 minutes), ou null s'il n'y en a plus. marginMs : la minute de
// marge du paiement (un clic à la dernière seconde garde le prix affiché).
export function offerWindowStart(welcomeEndsAt: number, flashEndsAt: number | null, now: number, marginMs = 0): number | null {
  if (flashEndsAt !== null && now <= flashEndsAt + marginMs) return flashEndsAt - FLASH_OFFER.windowMs;
  if (now <= welcomeEndsAt + marginMs) return welcomeEndsAt - WELCOME_WINDOW_MS;
  return null;
}

export type PriceTier = "welcome" | "regular";

/** Prix affichés au paywall (un seul objet, lu côté serveur puis passé aux composants). */
export type PriceSheet = {
  monthly: { welcome: string; regular: string };
  lifetime: { welcome: string; regular: string };
  auto: { monthly: { welcome: string; regular: string }; lifetime: { welcome: string; regular: string } };
};

export function priceSheet(legacy = false): PriceSheet {
  return {
    monthly: { welcome: legacy ? PREVIOUS_MONTHLY_WELCOME.price : PLAN_PRICES.monthly.welcome, regular: PLAN_PRICES.monthly.regular },
    lifetime: { ...PLAN_PRICES.lifetime },
    auto: { monthly: { ...AUTO_PRICES.monthly }, lifetime: { ...AUTO_PRICES.lifetime } },
  };
}

// Formule « Stageio Auto » (24/10, demande de Nathan) : Premium + chaque
// like envoie la candidature tout seul (jusqu'à 100 par jour, au-delà le
// like redevient un favori) + boîte mail de candidature. 17,99 €/mois ou
// 80 € à vie. Prix créés le 24/10 sur le produit Stripe « Stageio Auto »
// (clés de recherche stageio_auto_monthly_1799 / stageio_auto_lifetime_8000).
// Test de prix du 29/10 : ces prix deviennent les prix de bienvenue de
// l'Auto ; ensuite 28,79 €/mois et 128 € à vie (voir PRICE_TEST_START).
export const AUTO_PRICES = {
  monthly: { welcome: "17,99 €", regular: "28,79 €" },
  lifetime: { welcome: "80 €", regular: "128 €" },
} as const;
export const AUTO_MONTHLY_CENTS = 1799;
/** Montants mensuels de l'Auto (bienvenue et normal) : repli de isAutoTier. */
export const AUTO_MONTHLY_CENTS_ALL = [1799, 2879];
export const AUTO_DAILY_LIMIT = 100;
export const AUTO_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_AUTO_MONTHLY?.trim() || "price_1UU96mRd6r34OMU6vrO0Mhln",
  lifetime: process.env.STRIPE_PRICE_ID_AUTO_LIFETIME?.trim() || "price_1UU96qRd6r34OMU6aTrAx6Ho",
};
export const AUTO_REGULAR_PRICE_IDS = {
  monthly: "price_1UVgQQRd6r34OMU6AQ5zKrNg",
  lifetime: "price_1UVgQSRd6r34OMU6uBNB4JD5",
};
/** Tous les prix du mensuel Auto : un abonnement à l'un d'eux est l'Auto. */
export const AUTO_MONTHLY_PRICE_IDS = [AUTO_PRICE_IDS.monthly, AUTO_REGULAR_PRICE_IDS.monthly];
