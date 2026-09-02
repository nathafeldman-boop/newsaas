import type { Profile } from "@/types/database";

// "comp" = débloqué via un code d'accès admin (voir access_codes), pas un
// paiement Stripe réel : compte pour l'accès Premium mais jamais pour le LTV.
export function isPremium(profile: Pick<Profile, "subscription_status"> | null | undefined): boolean {
  return (
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing" ||
    profile?.subscription_status === "comp"
  );
}
