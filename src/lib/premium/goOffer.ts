import { AUTO_DAILY_LIMIT, AUTO_PRICES, FLASH_OFFER, lifetimeOfferFor, priceSheet } from "@/lib/pricing/plans";

// Page /paiement (lien de paiement d'un email ouvert sans être connecté) :
// la formule et le prix que startCheckout va encaisser, mêmes règles que le
// paywall. Sans dépendance serveur : lu par la page et par les tests.

export type GoCheckoutPlan = "monthly" | "lifetime" | "auto_lifetime";

export function isGoCheckoutPlan(plan: unknown): plan is GoCheckoutPlan {
  return plan === "monthly" || plan === "lifetime" || plan === "auto_lifetime";
}

/** Lien sans formule (?plan=choix) : la page montre le mensuel et l'accès à vie. */
export const GO_CHOICE = "choix";
export const GO_CHOICE_PLANS: readonly GoCheckoutPlan[] = ["lifetime", "monthly"];

export type GoWelcome = { active: boolean; endsAt: number; flashEndsAt: number | null; legacy: boolean };

export type GoPlanOffer = {
  title: string;
  price: string;
  perMonth: boolean;
  /** Prix normal, montré « ensuite » s'il est plus haut que le prix affiché.
   *  Jamais barré : pas d'annonce de réduction (comme l'email du 5/11). */
  regular: string | null;
  badge: string | null;
  /** Fin du prix affiché (offre de l'email ou prix de bienvenue), sinon null. */
  endsAt: number | null;
  /** Minutes restantes avant endsAt (au moins 1), sinon null. */
  minutesLeft: number | null;
  note: string;
  benefits: string[];
};

const PREMIUM_BENEFITS = ["Likes et candidatures illimités", "Une lettre de motivation pour chaque offre", "L'audit de ton CV et le simulateur d'entretien"];

// welcome : état du prix de bienvenue du compte (getWelcomeState), null pour
// un compte déjà Premium (pas de prix de bienvenue, comme au paywall).
export function goPlanOffer(plan: GoCheckoutPlan, welcome: GoWelcome | null, now: number = Date.now()): GoPlanOffer {
  const prices = priceSheet(welcome?.legacy ?? false);
  const active = !!welcome && welcome.active && now < welcome.endsAt;
  const flash = active && welcome.flashEndsAt !== null && now < welcome.flashEndsAt;
  const endsAt = active ? welcome.endsAt : null;
  const minutesLeft = endsAt !== null ? Math.max(1, Math.ceil((endsAt - now) / 60_000)) : null;
  const strike = (price: string, regular: string) => (price === regular ? null : regular);

  if (plan === "auto_lifetime") {
    const price = flash ? FLASH_OFFER.autoLifetimePrice : active ? AUTO_PRICES.lifetime.welcome : AUTO_PRICES.lifetime.regular;
    return {
      title: "Stageio Auto à vie",
      price,
      perMonth: false,
      regular: strike(price, AUTO_PRICES.lifetime.regular),
      badge: flash ? "Offre de l'email" : active ? "Prix de bienvenue" : null,
      endsAt,
      minutesLeft,
      note: "Paiement unique : aucun abonnement, rien à résilier.",
      benefits: [`Chaque like envoie ta candidature (${AUTO_DAILY_LIMIT} par jour)`, "Ta boîte mail de candidature", ...PREMIUM_BENEFITS],
    };
  }

  if (plan === "lifetime") {
    const offer = active ? lifetimeOfferFor(welcome.flashEndsAt, now) : null;
    const price = offer?.price ?? (active ? prices.lifetime.welcome : prices.lifetime.regular);
    return {
      title: "Stageio Premium à vie",
      price,
      perMonth: false,
      regular: strike(price, prices.lifetime.regular),
      badge: offer?.badge ?? (active ? "Prix de bienvenue" : null),
      endsAt,
      minutesLeft,
      note: "Paiement unique : aucun abonnement, rien à résilier.",
      benefits: PREMIUM_BENEFITS,
    };
  }

  const price = active ? prices.monthly.welcome : prices.monthly.regular;
  return {
    title: "Stageio Premium",
    price,
    perMonth: true,
    regular: strike(price, prices.monthly.regular),
    badge: active ? "Prix de bienvenue" : null,
    endsAt,
    minutesLeft,
    note: "Sans engagement : tu résilies quand tu veux.",
    benefits: PREMIUM_BENEFITS,
  };
}

/** « na•••@gmail.com » : assez pour reconnaître son compte, sans montrer l'adresse. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return `${email.slice(0, Math.min(2, at))}•••${email.slice(at)}`;
}
