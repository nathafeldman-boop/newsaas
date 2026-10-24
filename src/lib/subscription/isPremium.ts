import type { Profile } from "@/types/database";

// "comp" = débloqué via un code d'accès admin (voir access_codes), pas un
// paiement Stripe réel : compte pour l'accès Premium mais jamais pour le LTV.
// "lifetime" = paiement Stripe unique (39,99€, voir premium/actions.ts) : compte
// à la fois pour l'accès Premium ET pour le LTV (crédité via
// creditInvoicePayment comme n'importe quel autre paiement, voir le webhook
// Stripe), mais sans stripe_subscription_id ni current_period_end -- il n'y
// a rien à renouveler ni à annuler.
//
// Abonnement (mensuel, ou hebdomadaire pour les anciens comptes) : "active"
// ne suffit plus depuis le 14/10. Si le renouvellement échoue ou si
// l'abonnement est annulé et que l'événement Stripe ne nous arrive pas, le
// statut restait "active" pour toujours (comptes qui swipaient sans payer,
// signalés par Nathan). La période payée fait foi : au-delà de sa fin plus
// une marge pour l'arrivée du renouvellement, plus d'accès tant que Stripe
// n'a pas confirmé une nouvelle période (voir refreshStaleSubscription, qui
// redemande à Stripe dans ce cas avant de couper).
export const PERIOD_GRACE_MS = 24 * 60 * 60 * 1000;

type PremiumFields = Pick<Profile, "subscription_status"> & Partial<Pick<Profile, "current_period_end">>;
type AutoFields = PremiumFields & Partial<Pick<Profile, "premium_tier" | "subscription_price_cents" | "subscription_interval">>;

export function isSubscriptionPeriodOver(profile: PremiumFields, now = Date.now()): boolean {
  if (!profile.current_period_end) return false;
  const end = Date.parse(profile.current_period_end);
  return Number.isFinite(end) && end + PERIOD_GRACE_MS < now;
}

export function isPremium(profile: PremiumFields | null | undefined): boolean {
  if (!profile) return false;
  const status = profile.subscription_status;
  if (status === "comp" || status === "lifetime") return true;
  if (status === "active" || status === "trialing") return !isSubscriptionPeriodOver(profile);
  return false;
}

// Formule « Stageio Auto » (24/10) : envoi de la candidature au like.
// premium_tier est posé par le webhook Stripe ("auto" tant que l'abonnement
// Auto est sain, "auto_lifetime" pour l'accès à vie Auto). Tant que la
// colonne n'existe pas (SQL du 24/10), un abonnement mensuel à 17,99 € suffit.
export function isAutoTier(profile: AutoFields | null | undefined): boolean {
  if (!profile || !isPremium(profile)) return false;
  if (profile.premium_tier === "auto" || profile.premium_tier === "auto_lifetime") return true;
  return (
    (profile.subscription_status === "active" || profile.subscription_status === "trialing") &&
    profile.subscription_price_cents === 1799 &&
    profile.subscription_interval === "month"
  );
}
