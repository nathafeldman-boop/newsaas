import type { Profile } from "@/types/database";

export function isPremium(profile: Pick<Profile, "subscription_status"> | null | undefined): boolean {
  return profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
}
