import { unstable_cache } from "next/cache";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { compactGroup, expandGroup, fitCacheBudget, idEncoder, unpackIdTable, type Compacted } from "@/lib/seo/compactIds";
import { byPublishedDescThenId, fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { NOT_A_CITY, normalizeCityKey, preferCityNamedInTitle, slugify, titleCase } from "@/lib/offers/segments";
import { PUBLIC_OFFERS_PAGE_SIZE } from "@/lib/offers/fetchPublicOffers";
import { classifyFormations, classifyMetier, classifySpecialites } from "@/lib/seo/metiers";
import { isSchool } from "@/lib/seo/schools";
import { departementFromLocation, getDepartement, getRegionBySlug, learnCityDepartements, regionOfDepartement } from "@/lib/seo/departements";
import type { ContractType, OfferSource } from "@/types/database";

// Seuils des pages programmatiques (décision D de SEO_ROADMAP.md) :
// >= 10 offres : page indexable et dans le sitemap ; 3 à 9 : page
// accessible mais noindex ; < 3 : 404. En dessous de 10 offres, les stats
// (entreprises, salaire médian) reposent sur trop peu de valeurs et la
// page ressemble à une page vide pour Google.
export const INDEXABLE_MIN_OFFERS = 10;
export const PAGE_MIN_OFFERS = 3;
// Les pages programmatiques listent au plus 10 pages d'offres (240) : au-
// delà, renvoi vers la liste complète (/offres/ville/x ou /offres/stage).
// Garde l'index en cache sous la limite de 2 Mo du cache de données Vercel.
export const MAX_LISTED_PAGES = 10;
const MAX_IDS_PER_SEGMENT = MAX_LISTED_PAGES * PUBLIC_OFFERS_PAGE_SIZE;
const SALARY_MIN_SAMPLE = 5;
// Une page département n'existe pas si une seule ville y concentre au moins
// 90 % des offres : elle dupliquerait la page de cette ville (Paris, 75).
const DEPARTEMENT_MAX_CITY_SHARE = 0.9;

export type SegmentStats = {
  count: number;
  ids: string[];
  companyCount: number;
  topCompanies: { name: string; count: number }[];
  recent7d: number;
  salaryMedian: number | null;
  salaryN: number;
  // Date de publication de l'offre la plus récente du segment : "lastmod"
  // des sitemaps et filtre de l'envoi IndexNow quotidien.
  latest: string | null;
};
export type CityEntry = SegmentStats & { slug: string; label: string; dep: string | null };
export type DepartementEntry = SegmentStats & { code: string; slug: string; label: string };
export type DepartementComboEntry = SegmentStats & { metier: string; dep: string };
// `departements` : offres par code département dans la région (pour le
// bloc "départements qui recrutent", y compris ceux sans page propre).
export type RegionEntry = SegmentStats & { slug: string; label: string; departements: { code: string; count: number }[] };
export type RegionComboEntry = SegmentStats & { metier: string; region: string };
export type MetierEntry = SegmentStats & { slug: string };
export type ComboEntry = SegmentStats & { metier: string; city: string };

export type ProgrammaticIndex = {
  type: ContractType;
  generatedAt: string;
  total: number;
  recent7d: number;
  latest: string | null;
  cities: Record<string, CityEntry>;
  metiers: Record<string, MetierEntry>;
  combos: Record<string, ComboEntry>;
  // Clés : code département ("92") et "metier/code".
  departements: Record<string, DepartementEntry>;
  depCombos: Record<string, DepartementComboEntry>;
  // Clés : slug de région ("bretagne") et "metier/region".
  regions: Record<string, RegionEntry>;
  regionCombos: Record<string, RegionComboEntry>;
};

export type IndexRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  published_at: string;
  source: OfferSource;
};


// Salaire mensuel indiqué par l'employeur. Uniquement les offres France
// Travail / manuelles : le salaire Adzuna est très souvent une ESTIMATION
// d'Adzuna (salaire annuel de poste "adulte"), qui fausserait la médiane
// d'un alternant.
export function parseMonthlySalary(salary: string | null): number | null {
  if (!salary) return null;
  const text = salary
    .toLowerCase()
    .replace(/sur \d+(?:[.,]\d+)? mois/g, " ")
    .replace(/ /g, " ");
  const numbers = [...text.matchAll(/\d[\d ]*(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(/ /g, "").replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (numbers.length === 0) return null;
  const value = numbers.length >= 2 ? (numbers[0] + numbers[1]) / 2 : numbers[0];

  let monthly: number;
  if (/horaire|\/\s*h(eure)?\b|par heure/.test(text)) monthly = value * 151.67;
  else if (/annuel|\/\s*an\b|par an/.test(text)) monthly = value / 12;
  else if (/mensuel|\/\s*mois|par mois/.test(text)) monthly = value;
  else return null;

  return monthly >= 300 && monthly <= 6000 ? Math.round(monthly) : null;
}

type Accumulator = {
  count: number;
  ids: string[];
  // Clé normalisée ("alticome") -> libellés vus et nombre d'offres : "Alticome"
  // et "ALTICOME" sont la même entreprise.
  companies: Map<string, { labels: Map<string, number>; count: number }>;
  recent7d: number;
  salaries: number[];
  // Villes (pages département) ou départements (pages ville) rencontrés.
  places: Map<string, number>;
  latest: string | null;
};

function newAccumulator(): Accumulator {
  return { count: 0, ids: [], companies: new Map(), recent7d: 0, salaries: [], places: new Map(), latest: null };
}

function countPlace(acc: Accumulator, place: string | null) {
  if (place) acc.places.set(place, (acc.places.get(place) ?? 0) + 1);
}

function topPlace(acc: Accumulator): { place: string; share: number } | null {
  let best: [string, number] | null = null;
  for (const entry of acc.places) if (!best || entry[1] > best[1]) best = entry;
  return best ? { place: best[0], share: best[1] / acc.count } : null;
}

function add(acc: Accumulator, row: IndexRow, isRecent: boolean, salary: number | null) {
  acc.count += 1;
  if (acc.ids.length < MAX_IDS_PER_SEGMENT) acc.ids.push(row.id);
  if (!acc.latest || row.published_at > acc.latest) acc.latest = row.published_at;
  const company = row.company.trim();
  // Les écoles qui publient des annonces pour remplir leurs cursus comptent
  // dans le nombre d'offres, jamais dans les "entreprises qui recrutent".
  if (company && !isSchool(company)) {
    const key = company.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
    const entry = acc.companies.get(key) ?? { labels: new Map<string, number>(), count: 0 };
    entry.count += 1;
    entry.labels.set(company, (entry.labels.get(company) ?? 0) + 1);
    acc.companies.set(key, entry);
  }
  if (isRecent) acc.recent7d += 1;
  if (salary !== null) acc.salaries.push(salary);
}

function finalize(acc: Accumulator): SegmentStats {
  const sorted = [...acc.salaries].sort((a, b) => a - b);
  const median =
    sorted.length >= SALARY_MIN_SAMPLE
      ? sorted.length % 2
        ? sorted[(sorted.length - 1) / 2]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : null;
  return {
    count: acc.count,
    ids: acc.ids,
    companyCount: acc.companies.size,
    topCompanies: [...acc.companies.values()]
      .map(({ labels, count }) => ({ name: [...labels.entries()].sort((a, b) => b[1] - a[1])[0][0], count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6),
    recent7d: acc.recent7d,
    salaryMedian: median,
    salaryN: sorted.length,
    latest: acc.latest,
  };
}

async function computeIndex(type: ContractType): Promise<ProgrammaticIndex> {
  const supabase = createCatalogClient();
  const rows = await fetchAllRowsByIdCursor<IndexRow>((afterId, limit) => {
    let query = supabase
      .from("offers")
      .select("id, title, company, location, salary, published_at, source")
      .eq("is_active", true)
      .eq("contract_type", type);
    if (afterId) query = query.gt("id", afterId);
    return query.order("id").limit(limit);
  });
  // buildIndex attend les offres de la plus récente à la plus ancienne.
  return buildIndex(type, rows.sort(byPublishedDescThenId));
}

// Partie pure (testable sans base) : rows déjà triées du plus récent au
// plus ancien.
export function buildIndex(type: ContractType, rows: IndexRow[], now = Date.now()): ProgrammaticIndex {
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const cities = new Map<string, { label: string; acc: Accumulator }>();
  const metiers = new Map<string, Accumulator>();
  const combos = new Map<string, Accumulator>();
  const departements = new Map<string, Accumulator>();
  const depCombos = new Map<string, Accumulator>();
  const regions = new Map<string, Accumulator>();
  const regionCombos = new Map<string, Accumulator>();
  const learned = learnCityDepartements(rows.map((row) => row.location ?? ""));

  let recentTotal = 0;
  for (const row of rows) {
    const isRecent = new Date(row.published_at).getTime() >= weekAgo;
    if (isRecent) recentTotal += 1;
    const salary = row.source === "adzuna" ? null : parseMonthlySalary(row.salary);
    const metier = classifyMetier(row.title);
    // Même règle qu'à l'import Adzuna (« Allauch, Marseille » pour une offre
    // titrée « Marseille ») : appliquée ici aussi aux offres déjà en base.
    const location = row.location ? preferCityNamedInTitle(row.location, row.title) : null;
    const cityKey = location ? normalizeCityKey(location) : "";
    const citySlug = cityKey ? slugify(cityKey) : "";
    const isCity = Boolean(citySlug) && !NOT_A_CITY.has(citySlug);
    const dep = location ? departementFromLocation(location, learned) : null;

    if (dep) {
      if (!departements.has(dep)) departements.set(dep, newAccumulator());
      const depAcc = departements.get(dep)!;
      add(depAcc, row, isRecent, salary);
      countPlace(depAcc, isCity ? citySlug : null);
      if (metier) {
        const key = `${metier.slug}/${dep}`;
        if (!depCombos.has(key)) depCombos.set(key, newAccumulator());
        add(depCombos.get(key)!, row, isRecent, salary);
        countPlace(depCombos.get(key)!, isCity ? citySlug : null);
      }
      // Région : le "lieu" suivi est le département (une région dont un seul
      // département concentre 90 % des offres dupliquerait sa page).
      const region = regionOfDepartement(dep);
      if (region) {
        if (!regions.has(region.slug)) regions.set(region.slug, newAccumulator());
        add(regions.get(region.slug)!, row, isRecent, salary);
        countPlace(regions.get(region.slug)!, dep);
        if (metier) {
          const key = `${metier.slug}/${region.slug}`;
          if (!regionCombos.has(key)) regionCombos.set(key, newAccumulator());
          add(regionCombos.get(key)!, row, isRecent, salary);
          countPlace(regionCombos.get(key)!, dep);
        }
      }
    }

    if (isCity) {
      const label = titleCase(cityKey);
      const entry = cities.get(citySlug);
      if (!entry) cities.set(citySlug, { label, acc: newAccumulator() });
      // France Travail écrit "BOULOGNE BILLANCOURT", Adzuna "Boulogne-Billancourt" :
      // même slug, on garde l'orthographe avec tirets.
      else if (label.includes("-") && !entry.label.includes("-")) entry.label = label;
      add(cities.get(citySlug)!.acc, row, isRecent, salary);
      countPlace(cities.get(citySlug)!.acc, dep);
    }
    // Métier + spécialités (préparateur en pharmacie...) + diplômes cités
    // dans l'intitulé (BTS MCO...) : mêmes pages France entière et × ville,
    // mais pas d'échelle département / région pour les spécialités et les
    // diplômes (trop peu d'offres, pages quasi identiques).
    for (const tag of [metier, ...classifySpecialites(row.title), ...classifyFormations(row.title)]) {
      if (!tag) continue;
      if (!metiers.has(tag.slug)) metiers.set(tag.slug, newAccumulator());
      add(metiers.get(tag.slug)!, row, isRecent, salary);
      if (isCity) {
        const key = `${tag.slug}/${citySlug}`;
        if (!combos.has(key)) combos.set(key, newAccumulator());
        add(combos.get(key)!, row, isRecent, salary);
      }
    }
  }

  const index: ProgrammaticIndex = {
    type,
    generatedAt: new Date(now).toISOString(),
    total: rows.length,
    recent7d: recentTotal,
    latest: rows.reduce<string | null>((max, row) => (!max || row.published_at > max ? row.published_at : max), null),
    cities: {},
    metiers: {},
    combos: {},
    departements: {},
    depCombos: {},
    regions: {},
    regionCombos: {},
  };
  for (const [slug, { label, acc }] of cities) {
    if (acc.count >= PAGE_MIN_OFFERS) index.cities[slug] = { slug, label, dep: topPlace(acc)?.place ?? null, ...finalize(acc) };
  }
  for (const [slug, acc] of metiers) {
    if (acc.count >= PAGE_MIN_OFFERS) index.metiers[slug] = { slug, ...finalize(acc) };
  }
  for (const [key, acc] of combos) {
    const [metier, city] = key.split("/");
    if (acc.count >= PAGE_MIN_OFFERS && index.cities[city]) index.combos[key] = { metier, city, ...finalize(acc) };
  }
  const spread = (acc: Accumulator) => (topPlace(acc)?.share ?? 0) < DEPARTEMENT_MAX_CITY_SHARE;
  for (const [code, acc] of departements) {
    const departement = getDepartement(code);
    if (departement && acc.count >= PAGE_MIN_OFFERS && spread(acc)) {
      index.departements[code] = { code, slug: departement.slug, label: departement.name, ...finalize(acc) };
    }
  }
  for (const [key, acc] of depCombos) {
    const [metier, dep] = key.split("/");
    if (acc.count >= PAGE_MIN_OFFERS && index.departements[dep] && spread(acc)) {
      index.depCombos[key] = { metier, dep, ...finalize(acc) };
    }
  }
  for (const [slug, acc] of regions) {
    const region = getRegionBySlug(slug);
    if (region && acc.count >= PAGE_MIN_OFFERS && spread(acc)) {
      const departements = [...acc.places.entries()].map(([code, count]) => ({ code, count })).sort((x, y) => y.count - x.count);
      index.regions[slug] = { slug, label: region.name, departements, ...finalize(acc) };
    }
  }
  for (const [key, acc] of regionCombos) {
    const [metier, region] = key.split("/");
    if (acc.count >= PAGE_MIN_OFFERS && index.regions[region] && spread(acc)) {
      index.regionCombos[key] = { metier, region, ...finalize(acc) };
    }
  }
  return index;
}

type SegmentGroup = "cities" | "metiers" | "combos" | "departements" | "depCombos" | "regions" | "regionCombos";
type Scalars = Omit<ProgrammaticIndex, SegmentGroup>;
type AnySegment = SegmentStats & Record<string, unknown>;

function scalarsOf(index: Scalars): Scalars {
  return { type: index.type, generatedAt: index.generatedAt, total: index.total, recent7d: index.recent7d, latest: index.latest };
}

// L'index est mis en cache en plusieurs morceaux, chacun sa propre entrée
// de cache et sa propre table d'ids (voir compactIds.ts) : d'un seul tenant,
// il dépasserait la limite de 2 Mo vers 15 000 offres (synchro France
// Travail par département). Les segments métier × ville et métier ×
// département, de loin les plus nombreux, et les villes sont répartis sur
// deux morceaux chacun.
type Shard = { name: string; groups: SegmentGroup[]; part: number; parts: number };
const SHARDS: Shard[] = [
  { name: "core", groups: ["metiers", "departements", "regions"], part: 0, parts: 1 },
  { name: "cities-0", groups: ["cities"], part: 0, parts: 2 },
  { name: "cities-1", groups: ["cities"], part: 1, parts: 2 },
  { name: "combos-0", groups: ["combos"], part: 0, parts: 2 },
  { name: "combos-1", groups: ["combos"], part: 1, parts: 2 },
  { name: "depCombos-0", groups: ["depCombos"], part: 0, parts: 2 },
  { name: "depCombos-1", groups: ["depCombos"], part: 1, parts: 2 },
  { name: "regionCombos", groups: ["regionCombos"], part: 0, parts: 1 },
];

type CompactShard = Scalars & {
  segments: Partial<Record<SegmentGroup, Record<string, Compacted<AnySegment>>>>;
  idTable: string[];
};

function keyPart(key: string, parts: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(hash) % parts;
}

function compactShard(index: ProgrammaticIndex, shard: Shard): CompactShard {
  return fitCacheBudget((maxIds) => {
    const encoder = idEncoder();
    const segments: CompactShard["segments"] = {};
    for (const group of shard.groups) {
      const entries = Object.entries(index[group] as Record<string, AnySegment>).filter(([key]) => keyPart(key, shard.parts) === shard.part);
      segments[group] = compactGroup(Object.fromEntries(entries), encoder, maxIds);
    }
    return { ...scalarsOf(index), segments, idTable: encoder.table };
  }, `programmatic index ${index.type} [${shard.name}]: ${index.total} offres`);
}

export function compactShards(index: ProgrammaticIndex): CompactShard[] {
  return SHARDS.map((shard) => compactShard(index, shard));
}

// Le premier morceau ("core") porte les totaux.
export function expandShards(shards: CompactShard[]): ProgrammaticIndex {
  const index: ProgrammaticIndex = {
    ...scalarsOf(shards[0]),
    cities: {},
    metiers: {},
    combos: {},
    departements: {},
    depCombos: {},
    regions: {},
    regionCombos: {},
  };
  for (const shard of shards) {
    const ids = unpackIdTable(shard.idTable);
    for (const [group, segments] of Object.entries(shard.segments) as [SegmentGroup, Record<string, Compacted<AnySegment>>][]) {
      Object.assign(index[group], expandGroup(segments, ids));
    }
  }
  return index;
}

// Les morceaux expirent ensemble : un seul scan du catalogue par instance
// pour les recalculer tous (calcul partagé pendant quelques minutes).
const COMPUTE_REUSE_MS = 5 * 60 * 1000;
const computing = new Map<ContractType, { at: number; promise: Promise<ProgrammaticIndex> }>();

function sharedIndex(type: ContractType): Promise<ProgrammaticIndex> {
  const hit = computing.get(type);
  if (hit && Date.now() - hit.at < COMPUTE_REUSE_MS) return hit.promise;
  const promise = computeIndex(type);
  computing.set(type, { at: Date.now(), promise });
  promise.catch(() => {
    if (computing.get(type)?.promise === promise) computing.delete(type);
  });
  return promise;
}

// Un seul scan du catalogue par type et par heure, partagé par toutes les
// pages /alternance/* et /stage/* (sinon chaque page vue relirait tout le
// catalogue).
const cachedShard = unstable_cache(
  async (type: ContractType, name: string): Promise<CompactShard> => {
    const shard = SHARDS.find((s) => s.name === name);
    if (!shard) throw new Error(`Morceau d'index inconnu : ${name}`);
    return compactShard(await sharedIndex(type), shard);
  },
  ["programmatic-index-v15"],
  { revalidate: 3600 },
);

// Décompacté une fois par version des morceaux, pas à chaque appel.
const expanded = new Map<ContractType, { key: string; index: ProgrammaticIndex }>();

export async function getProgrammaticIndex(type: ContractType): Promise<ProgrammaticIndex> {
  const shards = await Promise.all(SHARDS.map((shard) => cachedShard(type, shard.name)));
  const key = shards.map((shard) => shard.generatedAt).join("|");
  const hit = expanded.get(type);
  if (hit && hit.key === key) return hit.index;
  const index = expandShards(shards);
  expanded.set(type, { key, index });
  return index;
}

export function cityPhrase(label: string): string {
  if (/^les\s/i.test(label)) return `aux ${label.slice(4)}`;
  if (/^le\s/i.test(label)) return `au ${label.slice(3)}`;
  return `à ${label}`;
}
