import { unstable_cache } from "next/cache";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import type { PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { PUBLIC_OFFERS_PAGE_SIZE, PUBLIC_OFFER_COLUMNS, isPageOutOfRange } from "@/lib/offers/fetchPublicOffers";
import { MIN_OFFERS_FOR_SEGMENT_PAGE, NOT_A_CITY, normalizeCityKey, slugify, titleCase, type CitySegment } from "@/lib/offers/segments";

// Pages « CDI débutant à <ville> » et « CDD débutant à <ville> » (12/11) :
// les recherches que font les jeunes diplômés (« cdi débutant lyon »). Même
// regroupement des villes que /offres/ville (segments.ts), limité à un type
// de contrat et aux offres indexables (ni Adzuna ni démo). Cache 1 h.

export type JobContract = "cdi" | "cdd";

export const JOB_CONTRACTS: readonly JobContract[] = ["cdi", "cdd"];

// En dessous, la page existe (5 offres et plus) mais reste en noindex.
export const INDEXABLE_CONTRACT_CITY_MIN = 10;

const REVALIDATE_SECONDS = 3600;

export function isJobContract(value: string): value is JobContract {
  return value === "cdi" || value === "cdd";
}

async function computeContractCitySegments(type: JobContract): Promise<CitySegment[]> {
  const supabase = createCatalogClient();
  const rows = await fetchAllRowsByIdCursor<{ id: string; location: string | null }>((afterId, limit) => {
    let query = supabase
      .from("offers")
      .select("id, location")
      .eq("is_active", true)
      .eq("contract_type", type)
      .not("source", "in", "(adzuna,demo)");
    if (afterId) query = query.gt("id", afterId);
    return query.order("id").limit(limit);
  });

  const bySlug = new Map<string, { label: string; count: number; locations: Set<string> }>();
  for (const row of rows) {
    if (!row.location) continue;
    const key = normalizeCityKey(row.location);
    if (!key) continue;
    const slug = slugify(key);
    if (!slug || NOT_A_CITY.has(slug)) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += 1;
      existing.locations.add(row.location);
    } else {
      bySlug.set(slug, { label: titleCase(key), count: 1, locations: new Set([row.location]) });
    }
  }
  return [...bySlug.entries()]
    .map(([slug, { label, count, locations }]) => ({ slug, label, count, locations: [...locations] }))
    .filter((c) => c.count >= MIN_OFFERS_FOR_SEGMENT_PAGE)
    .sort((a, b) => b.count - a.count);
}

const cachedSegments = unstable_cache(computeContractCitySegments, ["contract-city-segments-v1"], {
  revalidate: REVALIDATE_SECONDS,
});

export async function getContractCitySegments(type: JobContract): Promise<CitySegment[]> {
  try {
    return await cachedSegments(type);
  } catch (err) {
    console.error("getContractCitySegments failed", type, err);
    return [];
  }
}

export async function getContractCitySegment(type: JobContract, slug: string): Promise<CitySegment | null> {
  const segments = await cachedSegments(type);
  return segments.find((s) => s.slug === slug) ?? null;
}

async function fetchPage(type: JobContract, locations: string[], knownCount: number, page: number) {
  const { data, error } = await createCatalogClient()
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS)
    .eq("is_active", true)
    .eq("contract_type", type)
    .not("source", "in", "(adzuna,demo)")
    .in("location", locations)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }
  const totalPages = Math.max(1, Math.ceil(knownCount / PUBLIC_OFFERS_PAGE_SIZE));
  if ((data ?? []).length === 0 && page > 1) return { offers: [] as PublicOfferRow[], count: knownCount, totalPages: 0 };
  return { offers: (data ?? []) as PublicOfferRow[], count: knownCount, totalPages };
}

const cachedPage = unstable_cache(fetchPage, ["contract-city-page-v1"], { revalidate: REVALIDATE_SECONDS });

export async function fetchContractCityOffers(type: JobContract, segment: CitySegment, page: number) {
  return cachedPage(type, segment.locations, segment.count, page);
}
