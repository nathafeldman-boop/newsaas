import { unstable_cache } from "next/cache";
import { createPublicClient, fetchAllRowsByIdCursor } from "@/lib/supabase/public";
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

export function titleCase(text: string): string {
  return text.replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export type Segment = { slug: string; label: string; count: number };
// `locations` = les libellés bruts tels qu'en base qui tombent dans cette
// ville : permet de filtrer côté SQL (.in) au lieu de recharger tout le
// catalogue en mémoire pour chaque page ville.
export type CitySegment = Segment & { locations: string[] };

async function computeSectorSegments(): Promise<Segment[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRowsByIdCursor<{ id: string; sector: string | null }>((afterId, limit) => {
    let query = supabase.from("offers").select("id, sector").eq("is_active", true).not("sector", "is", null);
    if (afterId) query = query.gt("id", afterId);
    return query.order("id").limit(limit);
  });

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
// Villes dont le nom commence par un article, que certaines sources écrivent
// sans lui (« Mans » pour Le Mans, « Tampon » pour Le Tampon) : sans cette
// table, une page « Alternance à Mans » doublonnait « Alternance au Mans ».
// Clé = slug sans l'article. Aucune commune française ne porte ces noms
// sans article, la correspondance est donc sans ambiguïté.
export const CITY_ARTICLE_ALIASES: Record<string, string> = {
  mans: "Le Mans",
  havre: "Le Havre",
  tampon: "Le Tampon",
  creusot: "Le Creusot",
  "puy-en-velay": "Le Puy-en-Velay",
  "kremlin-bicetre": "Le Kremlin-Bicêtre",
  "blanc-mesnil": "Le Blanc-Mesnil",
  "plessis-robinson": "Le Plessis-Robinson",
  "perreux-sur-marne": "Le Perreux-sur-Marne",
  "chesnay-rocquencourt": "Le Chesnay-Rocquencourt",
  gosier: "Le Gosier",
  rochelle: "La Rochelle",
  ciotat: "La Ciotat",
  "seyne-sur-mer": "La Seyne-sur-Mer",
  "roche-sur-yon": "La Roche-sur-Yon",
  "garenne-colombes": "La Garenne-Colombes",
  courneuve: "La Courneuve",
  possession: "La Possession",
  "teste-de-buch": "La Teste-de-Buch",
  "baule-escoublac": "La Baule-Escoublac",
  "sables-d-olonne": "Les Sables-d'Olonne",
  ulis: "Les Ulis",
  mureaux: "Les Mureaux",
  lilas: "Les Lilas",
  abymes: "Les Abymes",
  // Quartiers donnés comme lieu par Adzuna (pages « Alternance à
  // Rangueuil » vues dans le sitemap le 08/10) : rattachés à leur ville.
  rangueil: "Toulouse",
  rangueuil: "Toulouse",
  "pont-rousseau": "Rezé",
};

export function normalizeCityKey(location: string): string {
  const withoutDepartment = location.replace(/^\s*(?:\d{2,3}|2[ab])\s*-\s*/i, "");
  const parts = withoutDepartment
    .split(/[,–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
  // « 8e Arrondissement, Paris » -> la partie suivante ; « Lyon 3e
  // Arrondissement, Rhône » -> la ville écrite avant l'arrondissement (la
  // partie suivante est le département).
  const namedArrondissement = parts[0]?.match(/^(\D+?)\s+\d{1,2}\s*(?:er|ème|eme|e)?\s*arrondissement\b/i);
  const city = namedArrondissement
    ? namedArrondissement[1]
    : parts.length > 1 && /arrondissement/i.test(parts[0])
      ? parts[1]
      : (parts[0] ?? "");

  const key = city
    .replace(/^france$/i, "")
    .replace(/\(\s*[\dab]{2,5}\s*\)/gi, " ")
    .replace(/\b\d{4,5}\b/g, " ")
    .replace(/\b\d{1,2}\s*(?:er|ème|eme|e)?\s*arrondissement\b/gi, " ")
    .replace(/\b\d{1,2}(?:er|ème|eme|e)\b/gi, " ")
    .replace(/\s+\d{1,2}$/, "")
    // Découpage en cantons d'Adzuna : "Toulouse Canton", "Roubaix Ouest",
    // "Aix-en-Provence Sud-Ouest" -> la ville elle-même.
    .replace(/[\s-]+(canton|centre|(nord|sud)(-(est|ouest))?|est|ouest)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return CITY_ARTICLE_ALIASES[slugify(key)] ?? key;
}

// Lieux qui ne sont pas des villes : Adzuna renvoie parfois seulement
// "Département, Région" ("Haute-Loire, Auvergne-Rhône-Alpes"). Ces offres
// n'ont pas de page "ville" ("Offres à Bas-Rhin" n'a pas de sens) mais
// restent listées partout ailleurs (type, secteur, métier).
export const NOT_A_CITY = new Set(
  [
    "ile-de-france", "auvergne-rhone-alpes", "nouvelle-aquitaine", "occitanie", "hauts-de-france", "grand-est",
    "provence-alpes-cote-d-azur", "bretagne", "normandie", "pays-de-la-loire", "centre-val-de-loire",
    "bourgogne-franche-comte", "corse", "ain", "aisne", "allier", "alpes-de-haute-provence", "hautes-alpes",
    "alpes-maritimes", "ardeche", "ardennes", "ariege", "aube", "aude", "aveyron", "bouches-du-rhone", "calvados",
    "cantal", "charente", "charente-maritime", "cher", "correze", "corse-du-sud", "haute-corse", "cote-d-or",
    "cotes-d-armor", "creuse", "dordogne", "doubs", "drome", "eure", "eure-et-loir", "finistere", "gard",
    "haute-garonne", "gers", "gironde", "herault", "ille-et-vilaine", "indre", "indre-et-loire", "isere", "jura",
    "landes", "loir-et-cher", "loire", "haute-loire", "loire-atlantique", "loiret", "lot", "lot-et-garonne", "lozere",
    "maine-et-loire", "manche", "marne", "haute-marne", "mayenne", "meurthe-et-moselle", "meuse", "morbihan",
    "moselle", "nievre", "nord", "oise", "orne", "pas-de-calais", "puy-de-dome", "pyrenees-atlantiques",
    "hautes-pyrenees", "pyrenees-orientales", "bas-rhin", "haut-rhin", "rhone", "haute-saone", "saone-et-loire",
    "sarthe", "savoie", "haute-savoie", "seine-maritime", "seine-et-marne", "yvelines", "deux-sevres", "somme",
    "tarn", "tarn-et-garonne", "var", "vaucluse", "vendee", "haute-vienne", "vosges", "yonne",
    "territoire-de-belfort", "essonne", "hauts-de-seine", "seine-saint-denis", "val-de-marne", "val-d-oise",
    "corse-du", "teletravail", "remote", "a-distance", "international", "etranger", "france-entiere", "toute-la-france",
    // Départements et régions d'outre-mer (« La Réunion » n'est pas une ville).
    "la-reunion", "reunion", "guadeloupe", "martinique", "guyane", "mayotte",
  ],
);

// Adzuna range parfois une offre d'une grande ville sous une commune
// voisine : « Allauch, Marseille » pour « Vendeur OM - Marseille » (82 offres
// sur la page Allauch le 08/10, presque toutes titrées « Marseille »). Quand
// le lieu est « commune, ville », que le titre cite la ville et pas la
// commune, l'offre est rattachée à la ville. « Ville, Département » et les
// arrondissements ne sont pas concernés.
export function preferCityNamedInTitle(location: string, title: string): string {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2 || /arrondissement/i.test(parts[0])) return location;
  const [commune, city] = parts;
  const citySlug = slugify(city);
  const communeSlug = slugify(commune);
  if (!citySlug || !communeSlug || citySlug === communeSlug || NOT_A_CITY.has(citySlug)) return location;
  const titleSlug = `-${slugify(title)}-`;
  if (!titleSlug.includes(`-${citySlug}-`) || titleSlug.includes(`-${communeSlug}-`)) return location;
  return city;
}

async function computeCitySegments(): Promise<CitySegment[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRowsByIdCursor<{ id: string; location: string | null }>((afterId, limit) => {
    let query = supabase.from("offers").select("id, location").eq("is_active", true);
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

const cachedCitySegments = unstable_cache(computeCitySegments, ["offers-city-segments-v3"], {
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

// Pages secteur et ville : le nombre d'offres vient du segment en cache (calculé
// avec la liste des secteurs / villes) plutôt que d'un count exact à chaque
// page vue. Avec plusieurs dizaines de libellés de lieu par grande ville
// (« 75 - PARIS 01 », « Paris 15e Arrondissement »…), le count exact a
// dépassé le délai de la base (/offres/ville, 07 et 08/10).
async function fetchSegmentPage(filter: (query: SegmentQuery) => SegmentQuery, knownCount: number, page: number) {
  const supabase = createPublicClient();
  const base = supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).eq("is_active", true);
  const { data, error } = await filter(base)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }
  const totalPages = Math.max(1, Math.ceil(knownCount / PUBLIC_OFFERS_PAGE_SIZE));
  // Page au-delà de la dernière (le compte en cache peut avoir du retard) : vide.
  if ((data ?? []).length === 0 && page > 1) return { offers: [] as PublicOfferRow[], count: knownCount, totalPages: 0 };
  return { offers: (data ?? []) as PublicOfferRow[], count: knownCount, totalPages };
}

type SegmentQuery = ReturnType<ReturnType<ReturnType<typeof createPublicClient>["from"]>["select"]>;

export async function fetchOffersForSector(segment: Segment, page: number) {
  return fetchSegmentPage((query) => query.eq("sector", segment.label), segment.count, page);
}

export async function fetchOffersForCity(segment: CitySegment, page: number) {
  return fetchSegmentPage((query) => query.in("location", segment.locations), segment.count, page);
}
