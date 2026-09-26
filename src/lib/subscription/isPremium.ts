import type { Profile } from "@/types/database";

// "comp" = débloqué via un code d'accès admin (voir access_codes), pas un
// paiement Stripe réel : compte pour l'accès Premium mais jamais pour le LTV.
// "lifetime" = paiement Stripe unique (70€, voir premium/actions.ts) : compte
// à la fois pour l'accès Premium ET pour le LTV (crédité via
// creditInvoicePayment comme n'importe quel autre paiement, voir le webhook
// Stripe), mais sans stripe_subscription_id ni current_period_end -- il n'y
// a rien à renouveler ni à annuler.
export function isPremium(profile: Pick<Profile, "subscription_status"> | null | undefined): boolean {
  return (
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing" ||
    profile?.subscription_status === "comp" ||
    profile?.subscription_status === "lifetime"
  );
}
