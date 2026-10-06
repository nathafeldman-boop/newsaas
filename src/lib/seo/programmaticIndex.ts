import { unstable_cache } from "next/cache";
import { createPublicClient, fetchAllRows } from "@/lib/supabase/public";
import { normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { PUBLIC_OFFERS_PAGE_SIZE } from "@/lib/offers/fetchPublicOffers";
import { classifyMetier } from "@/lib/seo/metiers";
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

export type SegmentStats = {
  count: number;
  ids: string[];
  companyCount: number;
  topCompanies: { name: string; count: number }[];
  recent7d: number;
  salaryMedian: number | null;
  salaryN: number;
};
export type CityEntry = SegmentStats & { slug: string; label: string };
export type MetierEntry = SegmentStats & { slug: string };
export type ComboEntry = SegmentStats & { metier: string; city: string };

export type ProgrammaticIndex = {
  type: ContractType;
  generatedAt: string;
  total: number;
  cities: Record<string, CityEntry>;
  metiers: Record<string, MetierEntry>;
  combos: Record<string, ComboEntry>;
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

// Lieux qui ne sont pas des villes : Adzuna renvoie parfois seulement
// "Département, Région" ("Haute-Loire, Auvergne-Rhône-Alpes"). Ces offres
// restent sur les pages métier (France entière) mais n'ont pas de page
// "ville" -- "Alternance à Haute-Loire" n'a pas de sens.
const NOT_A_CITY = new Set(
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
    "teletravail", "remote", "a-distance", "international", "etranger", "france-entiere", "toute-la-france",
  ],
);

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
  companies: Map<string, number>;
  recent7d: number;
  salaries: number[];
};

function newAccumulator(): Accumulator {
  return { count: 0, ids: [], companies: new Map(), recent7d: 0, salaries: [] };
}

function add(acc: Accumulator, row: IndexRow, isRecent: boolean, salary: number | null) {
  acc.count += 1;
  if (acc.ids.length < MAX_IDS_PER_SEGMENT) acc.ids.push(row.id);
  const company = row.company.trim();
  if (company) acc.companies.set(company, (acc.companies.get(company) ?? 0) + 1);
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
    topCompanies: [...acc.companies.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, count]) => ({ name, count })),
    recent7d: acc.recent7d,
    salaryMedian: median,
    salaryN: sorted.length,
  };
}

async function computeIndex(type: ContractType): Promise<ProgrammaticIndex> {
  const supabase = createPublicClient();
  const rows = await fetchAllRows<IndexRow>((from, to) =>
    supabase
      .from("offers")
      .select("id, title, company, location, salary, published_at, source")
      .eq("is_active", true)
      .eq("contract_type", type)
      .order("published_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return buildIndex(type, rows);
}

// Partie pure (testable sans base) : rows déjà triées du plus récent au
// plus ancien.
export function buildIndex(type: ContractType, rows: IndexRow[], now = Date.now()): ProgrammaticIndex {
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const cities = new Map<string, { label: string; acc: Accumulator }>();
  const metiers = new Map<string, Accumulator>();
  const combos = new Map<string, Accumulator>();

  for (const row of rows) {
    const isRecent = new Date(row.published_at).getTime() >= weekAgo;
    const salary = row.source === "adzuna" ? null : parseMonthlySalary(row.salary);
    const metier = classifyMetier(row.title);
    const cityKey = row.location ? normalizeCityKey(row.location) : "";
    const citySlug = cityKey ? slugify(cityKey) : "";
    const isCity = Boolean(citySlug) && !NOT_A_CITY.has(citySlug);

    if (isCity) {
      const label = titleCase(cityKey);
      const entry = cities.get(citySlug);
      if (!entry) cities.set(citySlug, { label, acc: newAccumulator() });
      // France Travail écrit "BOULOGNE BILLANCOURT", Adzuna "Boulogne-Billancourt" :
      // même slug, on garde l'orthographe avec tirets.
      else if (label.includes("-") && !entry.label.includes("-")) entry.label = label;
      add(cities.get(citySlug)!.acc, row, isRecent, salary);
    }
    if (metier) {
      if (!metiers.has(metier.slug)) metiers.set(metier.slug, newAccumulator());
      add(metiers.get(metier.slug)!, row, isRecent, salary);
      if (isCity) {
        const key = `${metier.slug}/${citySlug}`;
        if (!combos.has(key)) combos.set(key, newAccumulator());
        add(combos.get(key)!, row, isRecent, salary);
      }
    }
  }

  const index: ProgrammaticIndex = {
    type,
    generatedAt: new Date(now).toISOString(),
    total: rows.length,
    cities: {},
    metiers: {},
    combos: {},
  };
  for (const [slug, { label, acc }] of cities) {
    if (acc.count >= PAGE_MIN_OFFERS) index.cities[slug] = { slug, label, ...finalize(acc) };
  }
  for (const [slug, acc] of metiers) {
    if (acc.count >= PAGE_MIN_OFFERS) index.metiers[slug] = { slug, ...finalize(acc) };
  }
  for (const [key, acc] of combos) {
    const [metier, city] = key.split("/");
    if (acc.count >= PAGE_MIN_OFFERS && index.cities[city]) index.combos[key] = { metier, city, ...finalize(acc) };
  }
  return index;
}

// Un seul scan du catalogue par type et par heure, partagé par toutes les
// pages /alternance/* et /stage/* (sinon chaque page vue relirait ~3 000
// offres).
const cachedIndex = unstable_cache(computeIndex, ["programmatic-index-v1"], { revalidate: 3600 });

export function getProgrammaticIndex(type: ContractType): Promise<ProgrammaticIndex> {
  return cachedIndex(type);
}

export function cityPhrase(label: string): string {
  if (/^les\s/i.test(label)) return `aux ${label.slice(4)}`;
  if (/^le\s/i.test(label)) return `au ${label.slice(3)}`;
  return `à ${label}`;
}
