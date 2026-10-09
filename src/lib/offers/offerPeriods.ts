import { unstable_cache } from "next/cache";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { normalizeTitle } from "@/lib/seo/metiers";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import type { ContractType } from "@/types/database";

// Offres par période, repérées dans l'intitulé (aucune date de début
// structurée dans les offres) : « stage de fin d'études » (PFE, 6 mois, M2,
// 3A), « stage janvier 2027 », « alternance janvier 2027 » (rentrée
// décalée). Recherches d'automne des étudiants. Lecture en cache 1 h, rôle
// service, comme l'index des pages.

export type PeriodKey = "stage/fin-d-etudes" | "stage/janvier-2027" | "alternance/janvier-2027";

const EARLY_2027 =
  /janv(ier|\.)?\s*(20)?27\b|fevr?(ier|\.)?\s*(20)?27\b|(a partir de|des|debut|demarrage)\s+(mi-?)?(janvier|fevrier)|debut 2027/;

export const OFFER_PERIODS: Record<PeriodKey, { type: ContractType; slug: string; name: string; pattern: RegExp }> = {
  "stage/fin-d-etudes": {
    type: "stage",
    slug: "fin-d-etudes",
    name: "Stage de fin d'études",
    pattern: /\bpfe\b|\btfe\b|fin d'?\s?etudes|fin de cursus|stage de fin|\b6 mois\b|\bsix mois\b|\bm2\b|master 2\b|\b3a\b/,
  },
  "stage/janvier-2027": {
    type: "stage",
    slug: "janvier-2027",
    name: "Stage janvier 2027",
    pattern: new RegExp(`${EARLY_2027.source}|\\bstage 2027\\b|\\b2027\\b.{0,20}\\bstage\\b|\\bstage\\b.{0,20}\\b2027\\b`),
  },
  // Pas de « 2027 » seul : « alternance 2026-2027 » désigne l'année
  // scolaire commencée en septembre, pas une rentrée décalée.
  "alternance/janvier-2027": {
    type: "alternance",
    slug: "janvier-2027",
    name: "Alternance janvier 2027",
    pattern: new RegExp(`${EARLY_2027.source}|rentree (decalee|de janvier|de fevrier|de mars|en janvier|en fevrier|en mars)`),
  },
};

const byRecent = (a: PublicOfferRow, b: PublicOfferRow) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id);

function periodsOf(type: ContractType): PeriodKey[] {
  return (Object.keys(OFFER_PERIODS) as PeriodKey[]).filter((key) => OFFER_PERIODS[key].type === type);
}

// Stages (~3 000 offres) : lignes complètes. Alternance (~15 000) : d'abord
// id + intitulé, puis le détail des seules offres retenues.
const cachedPeriodOffers = unstable_cache(
  async (type: ContractType): Promise<Partial<Record<PeriodKey, PublicOfferRow[]>>> => {
    const supabase = createCatalogClient();
    const keys = periodsOf(type);
    const matches = (title: string) => keys.filter((key) => OFFER_PERIODS[key].pattern.test(normalizeTitle(title)));
    let rows: PublicOfferRow[];
    if (type === "stage") {
      rows = await fetchAllRowsByIdCursor<PublicOfferRow>((afterId, limit) => {
        let query = supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).eq("is_active", true).eq("contract_type", type);
        if (afterId) query = query.gt("id", afterId);
        return query.order("id").limit(limit);
      });
    } else {
      const titles = await fetchAllRowsByIdCursor<{ id: string; title: string }>((afterId, limit) => {
        let query = supabase.from("offers").select("id, title").eq("is_active", true).eq("contract_type", type);
        if (afterId) query = query.gt("id", afterId);
        return query.order("id").limit(limit);
      });
      const ids = titles.filter((row) => matches(row.title).length > 0).map((row) => row.id);
      rows = [];
      for (let i = 0; i < ids.length; i += 200) {
        const { data, error } = await supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).in("id", ids.slice(i, i + 200));
        if (error) throw new Error(error.message);
        rows.push(...((data ?? []) as PublicOfferRow[]));
      }
    }
    const result: Partial<Record<PeriodKey, PublicOfferRow[]>> = {};
    for (const key of keys) result[key] = rows.filter((row) => matches(row.title).includes(key)).sort(byRecent);
    return result;
  },
  ["offer-period-offers-v1"],
  { revalidate: 3600 },
);

export async function getPeriodOffers(key: PeriodKey): Promise<PublicOfferRow[]> {
  return (await cachedPeriodOffers(OFFER_PERIODS[key].type))[key] ?? [];
}
