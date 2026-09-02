import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { computeMatchScore } from "@/lib/matching/score";
import { computeQuotaStatus } from "@/lib/subscription/quota";
import type { Offer } from "@/types/database";

export default async function SwipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/swipe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const [{ data: swiped }, { data: applications }] = await Promise.all([
    supabase.from("swipes").select("offer_id, created_at").eq("user_id", user.id),
    supabase.from("applications").select("offer_id").eq("user_id", user.id),
  ]);

  const excludeIds = (swiped ?? []).map((s) => s.offer_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const swipesToday = (swiped ?? []).filter(
    (s) => new Date(s.created_at) >= todayStart,
  ).length;

  const { premium, quotaReached } = computeQuotaStatus(profile, swiped ?? [], applications ?? []);

  let offers: Offer[] = [];

  if (!quotaReached) {
    let query = supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(30);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    if (profile?.looking_for && profile.looking_for.length > 0) {
      query = query.in("contract_type", profile.looking_for);
    }

    const { data: rawOffers } = await query;
    offers = rawOffers ?? [];
  }

  const scores: Record<string, number> = {};
  if (profile) {
    for (const offer of offers) {
      scores[offer.id] = computeMatchScore(profile, offer);
    }
  }

  const sortedOffers = profile
    ? [...offers].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    : offers;

  return (
    <div className="flex flex-1 flex-col items-center">
      <SwipeDeck
        offers={sortedOffers}
        scores={scores}
        userId={user.id}
        swipesToday={swipesToday}
        isPremium={premium}
        quotaReached={quotaReached}
      />
    </div>
  );
}
