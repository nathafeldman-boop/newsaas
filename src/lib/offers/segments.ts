import { unstable_cache } from "next/cache";
import { createPublicClient, fetchAllRows } from "@/lib/supabase/public";
import type { PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { PUBLIC_OFFERS_PAGE_SIZE, PUBLIC_OFFER_COLUMNS, isPageOutOfRange } from "@/lib/offers/fetchPublicOffers";

// Sous ce seuil, pas de page dédiée : une page secteur/ville avec 1-2 offres
// est une page creuse (mauvais pour le visiteur ET pour le référencement,
// voir l'audit SEO du 02/10) -- mieux vaut ne pas la générer du tout
// (404 plutôt que noindex) que de la laisser exister avec presque rien
// dedans. Recalculé depuis la base active (cache 1 h) : les pages
// apparaissent/disparaissent automatiquement avec le catalogue, sans jamais
// avoir besoin d'une liste maintenue à la main.
export const MIN_OFFERS_FOR_SEGMENT_PAGE = 5;

// Les agrégats ne bougent qu'au rythme des crons d'import (1 fois/jour) :
// inutile de relire ~5 000 lignes à chaque visite de /offres.
const SEGMENTS_REVALIDATE_SECONDS = 3600;

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(text: string): string {
  return text.replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export type Segment = { slug: string; label: string; count: number };
// `locations` = les libellés bruts tels qu'en base qui tombent dans cette
// ville : permet de filtrer côté SQL (.in) au lieu de recharger tout le
// catalogue en mémoire pour chaque page ville.
export type CitySegment = Segment & { locations: string[] };

async function computeSectorSegments(): Promise<Segment[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRows<{ sector: string | null }>((from, to) =>
    supabase
      .from("offers")
      .select("sector")
      .eq("is_active", true)
      .not("sector", "is", null)
      .order("id")
      .range(from, to),
  );

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.sector) continue;
    counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([sector, count]) => ({ slug: slugify(sector), label: sector, count }))
    .filter((s) => s.count >= MIN_OFFERS_FOR_SEGMENT_PAGE)
    .sort((a, b) => b.count - a.count);
}

const cachedSectorSegments = unstable_cache(computeSectorSegments, ["offers-sector-segments-v2"], {
  revalidate: SEGMENTS_REVALIDATE_SECONDS,
});

// Pour les blocs de liens (chips) : une panne Supabase ne doit pas faire
// tomber toute la page /offres, on affiche simplement la page sans chips.
export async function getSectorSegments(): Promise<Segment[]> {
  try {
    return await cachedSectorSegments();
  } catch (err) {
    console.error("getSectorSegments failed", err);
    return [];
  }
}

// Pour la page secteur elle-même : on laisse remonter l'erreur (500, que
// Google réessaie) plutôt que de servir un 404 sur une page valide pendant
// une panne -- un 404 peut la faire sortir de l'index.
export async function getSectorSegment(slug: string): Promise<Segment | null> {
  const segments = await cachedSectorSegments();
  return segments.find((s) => s.slug === slug) ?? null;
}

// `location` est un texte libre rempli différemment selon la source :
//   Adzuna         "Annemasse, Saint-Julien-en-Genevois", "Paris, Ile-de-France",
//                  "1er Arrondissement, Paris", "Haute-Loire, Auvergne-Rhône-Alpes"
//   France Travail "75 - PARIS 08", "69 - Lyon 3e Arrondissement"
//   manuel         "Paris (75)", "Lyon 69003"
// Chez Adzuna le 1er segment est la commune, le 2e l'arrondissement
// administratif ou la région (jamais une 2e ville) -- les concaténer
// produisait des "villes" inexistantes ("Annemasse Saint-Julien-En-Genevois").
// Heuristique volontairement simple, pas une vraie géolocalisation.
export function normalizeCityKey(location: string): string {
  const withoutDepartment = location.replace(/^\s*(?:\d{2,3}|2[ab])\s*-\s*/i, "");
  const parts = withoutDepartment
    .split(/[,–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts.length > 1 && /arrondissement/i.test(parts[0]) ? parts[1] : (parts[0] ?? "");

  return city
    .replace(/^france$/i, "")
    .replace(/\(\s*[\dab]{2,5}\s*\)/gi, " ")
    .replace(/\b\d{4,5}\b/g, " ")
    .replace(/\b\d{1,2}\s*(?:er|ème|eme|e)?\s*arrondissement\b/gi, " ")
    .replace(/\b\d{1,2}(?:er|ème|eme|e)\b/gi, " ")
    .replace(/\s+\d{1,2}$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function computeCitySegments(): Promise<CitySegment[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRows<{ location: string | null }>((from, to) =>
    supabase.from("offers").select("location").eq("is_active", true).order("id").range(from, to),
  );

  const bySlug = new Map<string, { label: string; count: number; locations: Set<string> }>();
  for (const row of rows) {
    if (!row.location) continue;
    const key = normalizeCityKey(row.location);
    if (!key) continue;
    const slug = slugify(key);
    if (!slug) continue;
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

const cachedCitySegments = unstable_cache(computeCitySegments, ["offers-city-segments-v2"], {
  revalidate: SEGMENTS_REVALIDATE_SECONDS,
});

export async function getCitySegments(): Promise<CitySegment[]> {
  try {
    return await cachedCitySegments();
  } catch (err) {
    console.error("getCitySegments failed", err);
    return [];
  }
}

export async function getCitySegment(slug: string): Promise<CitySegment | null> {
  const segments = await cachedCitySegments();
  return segments.find((s) => s.slug === slug) ?? null;
}

export async function fetchOffersForSector(sectorLabel: string, page: number) {
  const supabase = createPublicClient();
  const { data, count, error } = await supabase
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .eq("sector", sectorLabel)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PUBLIC_OFFERS_PAGE_SIZE));
  return { offers: (data ?? []) as PublicOfferRow[], count: count ?? 0, totalPages };
}

export async function fetchOffersForCity(segment: CitySegment, page: number) {
  const supabase = createPublicClient();
  const { data, count, error } = await supabase
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .in("location", segment.locations)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PUBLIC_OFFERS_PAGE_SIZE));
  return { offers: (data ?? []) as PublicOfferRow[], count: count ?? 0, totalPages };
}
