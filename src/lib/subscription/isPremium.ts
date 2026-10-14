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
