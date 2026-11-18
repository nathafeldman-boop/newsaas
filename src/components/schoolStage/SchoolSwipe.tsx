import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { createClient } from "@/lib/supabase/server";
import { geoMatch } from "@/lib/matching/score";
import { refreshSchoolOffers } from "@/lib/schoolStage/schoolOffers";
import { SCHOOL_STAGES } from "@/lib/schoolStage/levels";
import type { Offer, Profile } from "@/types/database";

// Paquet d'un élève (18/11) : seulement les stages scolaires de sa classe,
// près de chez lui. Les vraies offres (1élève1stage) d'abord, puis les
// entreprises proches en candidature spontanée. Like, favoris, paywall et
// candidature : exactement comme pour les autres.

const DECK_SIZE = 30;

export async function SchoolSwipe({
  profile,
  userId,
  excludeIds,
  premium,
  totalSwipesEver,
  applicationStreak,
}: {
  profile: Profile;
  userId: string;
  excludeIds: string[];
  premium: boolean;
  totalSwipesEver: number;
  applicationStreak: number;
}) {
  const level = profile.school_stage!;
  const point = await refreshSchoolOffers(profile);
  const supabase = await createClient();
  let q = supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .eq("contract_type", "stage_scolaire")
    .contains("school_levels", [level])
    .order("quality_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(300);
  if (excludeIds.length > 0) q = q.not("id", "in", `(${excludeIds.join(",")})`);
  if (point?.departement) q = q.like("location", `${point.departement} -%`);
  const { data, error } = await q;
  if (error) console.error("stages scolaires : paquet illisible", error.message);
  const offers: Offer[] = data ?? [];

  const geo = { city: profile.city, mobility: profile.mobility };
  const scores: Record<string, number> = {};
  const reasons: Record<string, string[]> = {};
  for (const o of offers) {
    const near = geoMatch(geo, o).points;
    const real = o.source === "1eleve1stage";
    scores[o.id] = Math.max(40, Math.min(97, (real ? 82 : 66) + Math.min(near, 12)));
    reasons[o.id] = [
      real ? `Vraie offre de ${SCHOOL_STAGES[level].label.toLowerCase()}` : "Entreprise près de chez toi",
      ...(near >= 8 ? [`Près de ${profile.city}`] : []),
      real ? "Source : 1élève1stage" : "Candidature spontanée",
    ];
  }
  const deck = [...offers].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)).slice(0, DECK_SIZE);
  const real = deck.filter((o) => o.source === "1eleve1stage").length;

  return (
    <div className="flex flex-1 flex-col items-center">
      <SwipeDeck
        offers={deck}
        scores={scores}
        reasons={reasons}
        userId={userId}
        totalSwipesEver={totalSwipesEver}
        isPremium={premium}
        cityBanner={
          deck.length > 0
            ? `${SCHOOL_STAGES[level].label} autour de ${profile.city} : ${real} offre${real > 1 ? "s" : ""} publiée${real > 1 ? "s" : ""}, puis des entreprises à contacter.`
            : null
        }
        sectorLabel={SCHOOL_STAGES[level].label}
        applicationStreak={applicationStreak}
        isAuto={false}
        autoOfferAvailable={false}
      />
    </div>
  );
}
