import { unstable_cache } from "next/cache";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { NOT_A_CITY, normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { classifyMetier, getMetier, isFormation, isSpecialite, type Metier } from "@/lib/seo/metiers";
import type { JobContract } from "@/lib/offers/contractCitySegments";

// Pages « CDI de vendeur à Lyon », « CDD en logistique » (25/11, Nathan :
// « le SEO ramène du monde, fais-nous d'autres pages »). Même classement
// des métiers que les pages alternance et stage (metiers.ts), sur les
// offres CDI et CDD indexables (ni Adzuna ni démo). Recalculé toutes les 6 h.

export const CONTRACT_METIER_PAGE_MIN = 5;
export const CONTRACT_METIER_INDEXABLE_MIN = 10;
const REVALIDATE_SECONDS = 6 * 3600;

export type ContractMetierSegment = {
  metier: string;
  /** null : toute la France. */
  city: string | null;
  cityLabel: string | null;
  count: number;
  /** Offres, les plus récentes d'abord. */
  ids: string[];
};

export type ContractMetierIndex = {
  metiers: ContractMetierSegment[];
  combos: ContractMetierSegment[];
};

type Row = { id: string; title: string | null; location: string | null; published_at: string | null };

async function computeIndex(type: JobContract): Promise<ContractMetierIndex> {
  const supabase = createCatalogClient();
  const rows = await fetchAllRowsByIdCursor<Row>((afterId, limit) => {
    let query = supabase
      .from("offers")
      .select("id, title, location, published_at")
      .eq("is_active", true)
      .eq("contract_type", type)
      .not("source", "in", "(adzuna,demo)")
      .eq("seo_only", false);
    if (afterId) query = query.gt("id", afterId);
    return query.order("id").limit(limit);
  });
  rows.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

  const metiers = new Map<string, ContractMetierSegment>();
  const combos = new Map<string, ContractMetierSegment>();
  for (const row of rows) {
    if (!row.title) continue;
    const metier = classifyMetier(row.title);
    // Diplômes (BTS, bachelor...) et spécialités : pages réservées à l'alternance.
    if (!metier || isFormation(metier.slug) || isSpecialite(metier.slug)) continue;
    const m = metiers.get(metier.slug) ?? { metier: metier.slug, city: null, cityLabel: null, count: 0, ids: [] };
    m.count += 1;
    m.ids.push(row.id);
    metiers.set(metier.slug, m);
    if (!row.location) continue;
    const key = normalizeCityKey(row.location);
    const city = key ? slugify(key) : "";
    if (!city || NOT_A_CITY.has(city)) continue;
    const comboKey = `${metier.slug}/${city}`;
    const c = combos.get(comboKey) ?? { metier: metier.slug, city, cityLabel: titleCase(key), count: 0, ids: [] };
    c.count += 1;
    c.ids.push(row.id);
    combos.set(comboKey, c);
  }
  const keep = (s: ContractMetierSegment) => s.count >= CONTRACT_METIER_PAGE_MIN;
  const trim = (s: ContractMetierSegment) => ({ ...s, ids: s.ids.slice(0, 240) });
  return {
    metiers: [...metiers.values()].filter(keep).map(trim).sort((a, b) => b.count - a.count),
    combos: [...combos.values()].filter(keep).map(trim).sort((a, b) => b.count - a.count),
  };
}

const cachedIndex = unstable_cache(computeIndex, ["contract-metier-index-v1"], { revalidate: REVALIDATE_SECONDS });

export async function getContractMetierIndex(type: JobContract): Promise<ContractMetierIndex> {
  try {
    return await cachedIndex(type);
  } catch (err) {
    console.error("getContractMetierIndex failed", type, err);
    return { metiers: [], combos: [] };
  }
}

export async function getContractMetierSegment(
  type: JobContract,
  metierSlug: string,
  citySlug: string | null,
): Promise<{ segment: ContractMetierSegment; metier: Metier; index: ContractMetierIndex } | null> {
  const metier = getMetier(metierSlug);
  if (!metier) return null;
  const index = await getContractMetierIndex(type);
  const segment = citySlug
    ? index.combos.find((c) => c.metier === metierSlug && c.city === citySlug)
    : index.metiers.find((m) => m.metier === metierSlug);
  return segment ? { segment, metier, index } : null;
}

export function contractMetierPath(type: JobContract, metier: string, city: string | null): string {
  return city ? `/offres/${type}/metier/${metier}/${city}` : `/offres/${type}/metier/${metier}`;
}
