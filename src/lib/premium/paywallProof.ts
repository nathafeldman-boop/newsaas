import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDepartmentLocation } from "@/lib/onboarding/options";

// Paywall (SOP 12, 17/10) -- deux éléments, toujours réels :
// - la personnalisation perçue : « on a remarqué que… », ses propres
//   réponses d'onboarding réinjectées, avec le vrai nombre d'offres qui y
//   correspondent ;
// - la preuve chiffrée d'un bénéfice : les lettres de motivation réellement
//   écrites par Stageio ces 30 derniers jours.

const TIMEOUT_MS = 2500;

function withTimeout<T>(promise: PromiseLike<T>): Promise<T | null> {
  return Promise.race([Promise.resolve(promise), new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))]);
}

export type ProfileOfferMatch = { count: number; contract: string; sectors: string[]; city: string | null };

export async function getProfileOfferMatch(userId: string): Promise<ProfileOfferMatch | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("looking_for, sectors, city").eq("id", userId).maybeSingle();
  if (!profile || (profile.looking_for.length === 0 && profile.sectors.length === 0)) return null;

  const contract =
    profile.looking_for.includes("alternance") && profile.looking_for.includes("stage")
      ? "une alternance ou un stage"
      : profile.looking_for.includes("stage")
        ? "un stage"
        : "une alternance";
  const count = async (withCity: boolean) => {
    let query = admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true);
    if (profile.looking_for.length > 0) query = query.in("contract_type", profile.looking_for);
    if (profile.sectors.length > 0) query = query.in("sector", profile.sectors);
    if (withCity && profile.city) query = query.ilike("location", `%${profile.city.trim()}%`);
    const result = await withTimeout(query);
    return result?.count ?? null;
  };

  // La ville n'est citée que si l'offre locale est assez fournie ; sinon on
  // parle des offres en France (jamais une ville avec un chiffre national).
  const useCity = !!profile.city && !isDepartmentLocation(profile.city);
  const local = useCity ? await count(true) : null;
  if (local !== null && local >= 10) return { count: local, contract, sectors: profile.sectors, city: profile.city };
  const national = await count(false);
  return national !== null && national > 0 ? { count: national, contract, sectors: profile.sectors, city: null } : null;
}

export const getLettersWrittenLast30Days = unstable_cache(
  async (): Promise<number | null> => {
    const { count, error } = await createAdminClient()
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "cover_letter_generated")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw new Error(error.message);
    return count;
  },
  ["paywall-letters-30d"],
  { revalidate: 3600 },
);
