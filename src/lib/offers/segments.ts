import { createClient } from "@/lib/supabase/server";
import type { PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { PUBLIC_OFFERS_PAGE_SIZE } from "@/lib/offers/fetchPublicOffers";

// Sous ce seuil, pas de page dédiée : une page secteur/ville avec 1-2 offres
// est une page creuse (mauvais pour le visiteur ET pour le référencement,
// voir l'audit SEO du 02/10) -- mieux vaut ne pas la générer du tout
// (404 plutôt que noindex) que de la laisser exister avec presque rien
// dedans. Recalculé à chaque requête depuis la base active : les pages
// apparaissent/disparaissent automatiquement avec le catalogue, sans jamais
// avoir besoin d'une liste maintenue à la main.
export const MIN_OFFERS_FOR_SEGMENT_PAGE = 5;

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

export async function getSectorSegments(): Promise<Segment[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("sector").eq("is_active", true).not("sector", "is", null);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.sector) continue;
    counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([sector, count]) => ({ slug: slugify(sector), label: sector, count }))
    .filter((s) => s.count >= MIN_OFFERS_FOR_SEGMENT_PAGE)
    .sort((a, b) => b.count - a.count);
}

export async function getSectorSegment(slug: string): Promise<Segment | null> {
  const segments = await getSectorSegments();
  return segments.find((s) => s.slug === slug) ?? null;
}

// `location` est un texte libre rempli différemment selon la source
// (Adzuna, France Travail, saisie manuelle) : "Paris", "Paris 15e",
// "PARIS (75)" doivent compter comme la même ville. Normalisation
// volontairement simple (retire code postal / arrondissement) -- un
// heuristique, pas une géolocalisation réelle ; voir la discussion avec
// Nathan du 02/10 sur la répartition très inégale du catalogue.
export function normalizeCityKey(location: string): string {
  return location
    .replace(/,?\s*france\s*$/i, "")
    .replace(/\(\s*\d{2,5}\s*\)/g, " ")
    .replace(/\b\d{4,5}\b/g, " ")
    .replace(/\b\d{1,2}(er|ème|eme|e)\b/gi, " ")
    // Virgule et tirets longs seulement -- un simple "-" fait partie du nom
    // de beaucoup de villes françaises (Boulogne-Billancourt, Saint-Denis,
    // Aix-en-Provence) et doit être préservé, pas traité comme séparateur.
    .replace(/[,–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAllActiveLocations(): Promise<Pick<PublicOfferRow, "location">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("location").eq("is_active", true).limit(5000);
  return data ?? [];
}

export async function getCitySegments(): Promise<Segment[]> {
  const rows = await fetchAllActiveLocations();
  const counts = new Map<string, { label: string; count: number }>();

  for (const row of rows) {
    if (!row.location) continue;
    const key = normalizeCityKey(row.location);
    if (!key) continue;
    const slug = slugify(key);
    const existing = counts.get(slug);
    if (existing) existing.count += 1;
    else counts.set(slug, { label: titleCase(key), count: 1 });
  }

  return [...counts.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .filter((c) => c.count >= MIN_OFFERS_FOR_SEGMENT_PAGE)
    .sort((a, b) => b.count - a.count);
}

export async function getCitySegment(slug: string): Promise<Segment | null> {
  const segments = await getCitySegments();
  return segments.find((s) => s.slug === slug) ?? null;
}

export async function fetchOffersForSector(sectorLabel: string, page: number) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("offers")
    .select("id, title, company, location, contract_type, sector, published_at", { count: "exact" })
    .eq("is_active", true)
    .eq("sector", sectorLabel)
    .order("published_at", { ascending: false })
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PUBLIC_OFFERS_PAGE_SIZE));
  return { offers: (data ?? []) as PublicOfferRow[], count: count ?? 0, totalPages };
}

// `location` n'étant pas normalisé en base, le filtre par ville ne peut pas
// se faire côté SQL (pas de colonne "ville normalisée") -- on filtre en
// mémoire sur le même jeu de lignes que getCitySegments(), avec la même
// clé de normalisation, puis on pagine manuellement.
export async function fetchOffersForCity(citySlug: string, page: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("id, title, company, location, contract_type, sector, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(5000);

  const matching = (data ?? []).filter(
    (row) => row.location && slugify(normalizeCityKey(row.location)) === citySlug,
  ) as PublicOfferRow[];

  const totalPages = Math.max(1, Math.ceil(matching.length / PUBLIC_OFFERS_PAGE_SIZE));
  const start = (page - 1) * PUBLIC_OFFERS_PAGE_SIZE;
  return { offers: matching.slice(start, start + PUBLIC_OFFERS_PAGE_SIZE), count: matching.length, totalPages };
}
