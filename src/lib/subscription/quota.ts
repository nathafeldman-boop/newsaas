import type { Profile } from "@/types/database";
import { isPremium } from "./isPremium";

// Hard paywall après 3 swipes gratuits par semaine. Miroir du trigger SQL
// enforce_swipe_quota (voir supabase/migrations), qui est la vraie limite
// appliquée côté base -- ce nombre ne doit jamais diverger du sien.
// (Remis à 3 : le passage à 5 du 10/09 n'a jamais été collé côté Supabase,
// donc jamais réellement en prod -- retour à l'identique du 8/09.)
export const FREE_WEEKLY_SWIPE_QUOTA = 3;

// Miroir du trigger SQL enforce_swipe_quota : seuls les swipes de pure
// découverte (sans candidature associée) comptent dans le quota gratuit.
export function computeQuotaStatus(
  profile: Pick<Profile, "subscription_status"> | null | undefined,
  swipes: { offer_id: string; created_at: string }[],
  applications: { offer_id: string }[],
) {
  const premium = isPremium(profile);
  if (premium) {
    return { premium, quotaReached: false, browseSwipesThisWeek: 0 };
  }

  const appliedOfferIds = new Set(applications.map((a) => a.offer_id));
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const browseSwipesThisWeek = swipes.filter(
    (s) => new Date(s.created_at) >= sevenDaysAgo && !appliedOfferIds.has(s.offer_id),
  ).length;

  return {
    premium,
    quotaReached: browseSwipesThisWeek >= FREE_WEEKLY_SWIPE_QUOTA,
    browseSwipesThisWeek,
  };
}
