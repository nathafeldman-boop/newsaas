import { unstable_cache } from "next/cache";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { normalizeTitle } from "@/lib/seo/metiers";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";

// Stages par période : « stage de fin d'études » (PFE, 6 mois, M2, 3A) et
// « stage janvier 2027 » (offres qui démarrent en début d'année). Les
// étudiants d'école de commerce et d'ingénieurs cherchent ces offres dès
// l'automne. Repérées dans l'intitulé : aucune date de début structurée
// n'existe dans les offres. Une seule lecture des offres de stage actives,
// en cache 1 h (rôle service, comme l'index des pages).

export type StagePeriodSlug = "fin-d-etudes" | "janvier-2027";

export const STAGE_PERIODS: Record<StagePeriodSlug, { name: string; pattern: RegExp }> = {
  "fin-d-etudes": {
    name: "Stage de fin d'études",
    pattern: /\bpfe\b|\btfe\b|fin d'?\s?etudes|fin de cursus|stage de fin|\b6 mois\b|\bsix mois\b|\bm2\b|master 2\b|\b3a\b/,
  },
  "janvier-2027": {
    name: "Stage janvier 2027",
    pattern: /janv(ier|\.)?\s*(20)?27\b|fevr?(ier|\.)?\s*(20)?27\b|(a partir de|des|debut|demarrage)\s+(mi-?)?(janvier|fevrier)|debut 2027|\bstage 2027\b|\b2027\b.{0,20}\bstage\b|\bstage\b.{0,20}\b2027\b/,
  },
};

const cachedStagePeriodOffers = unstable_cache(
  async (): Promise<Record<StagePeriodSlug, PublicOfferRow[]>> => {
    const supabase = createCatalogClient();
    const rows = await fetchAllRowsByIdCursor<PublicOfferRow>((afterId, limit) => {
      let query = supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).eq("is_active", true).eq("contract_type", "stage");
      if (afterId) query = query.gt("id", afterId);
      return query.order("id").limit(limit);
    });
    const byRecent = (a: PublicOfferRow, b: PublicOfferRow) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id);
    const result = {} as Record<StagePeriodSlug, PublicOfferRow[]>;
    for (const slug of Object.keys(STAGE_PERIODS) as StagePeriodSlug[]) {
      result[slug] = rows.filter((row) => STAGE_PERIODS[slug].pattern.test(normalizeTitle(row.title))).sort(byRecent);
    }
    return result;
  },
  ["stage-period-offers-v1"],
  { revalidate: 3600 },
);

export async function getStagePeriodOffers(slug: StagePeriodSlug): Promise<PublicOfferRow[]> {
  return (await cachedStagePeriodOffers())[slug];
}
