import { unstable_cache } from "next/cache";
import { compactGroup, expandGroup, fitCacheBudget, idEncoder, unpackIdTable, type Compacted } from "@/lib/seo/compactIds";
import { createPublicClient, fetchAllRows } from "@/lib/supabase/public";
import { NOT_A_CITY, normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { PUBLIC_OFFERS_PAGE_SIZE } from "@/lib/offers/fetchPublicOffers";
import { classifyMetier } from "@/lib/seo/metiers";
import { isSchool } from "@/lib/seo/schools";
import { PAGE_MIN_OFFERS, MAX_LISTED_PAGES, parseMonthlySalary } from "@/lib/seo/programmaticIndex";
import type { ContractType, OfferSource } from "@/types/database";

// Pages /entreprises/[entreprise] : "alternance decathlon", "stage edf"...
// Une entreprise = un nom normalisé (slug), alternance et stage confondus.
// Mêmes seuils que les pages métier × ville (3 offres pour exister, 10 pour
// être indexée). Les écoles (voir schools.ts) n'ont jamais de page.
const MAX_IDS = MAX_LISTED_PAGES * PUBLIC_OFFERS_PAGE_SIZE;
const SALARY_MIN_SAMPLE = 5;

type Row = {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: ContractType;
  salary: string | null;
  published_at: string;
  source: OfferSource;
};

export type Count = { slug: string; label: string; count: number };

export type CompanyEntry = {
  slug: string;
  label: string;
  count: number;
  byType: Record<ContractType, number>;
  ids: string[];
  recent7d: number;
  cities: Count[];
  metiers: Count[];
  salaryMedian: number | null;
  salaryN: number;
  // Offre la plus récente : "lastmod" du sitemap entreprises.
  latest: string | null;
};

// aliases : slug d'une variante fusionnée -> slug de la page (voir canonicalCompanySlugs).
export type CompanyIndex = { generatedAt: string; companies: Record<string, CompanyEntry>; aliases: Record<string, string> };

type Acc = {
  labels: Map<string, number>;
  count: number;
  byType: Record<ContractType, number>;
  ids: string[];
  recent7d: number;
  cities: Map<string, { label: string; count: number }>;
  metiers: Map<string, { label: string; count: number }>;
  salaries: number[];
  latest: string | null;
};

function top(map: Map<string, { label: string; count: number }>, n: number): Count[] {
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, n);
}

// Un même employeur publie sous plusieurs noms : "Adecco", "Adecco France",
// "ADECCO FR", "Orange SA", "Groupe Lactalis". Sans fusion, autant de pages
// presque identiques qui se concurrencent sur "alternance adecco". Formes
// juridiques, "France", "Group(e)" retirés en fin (ou "Groupe" en début) de
// nom, mais seulement quand le nom raccourci existe déjà dans les offres :
// "Air France" ne devient jamais "Air".
const COMPANY_SUFFIX = /-(en-france|france|fr|sa|sas|sasu|sarl|eurl|se|snc|group|groupe|retail)$/;
const COMPANY_PREFIX = /^groupe?-/;

export function companySlugVariants(slug: string): string[] {
  const out: string[] = [];
  const unprefixed = slug.replace(COMPANY_PREFIX, "");
  for (let base of unprefixed && unprefixed !== slug ? [slug, unprefixed] : [slug]) {
    out.push(base);
    while (COMPANY_SUFFIX.test(base)) {
      base = base.replace(COMPANY_SUFFIX, "");
      if (base) out.push(base);
    }
  }
  return out;
}

// Slug de page pour chaque slug brut : la variante connue la plus courte.
export function canonicalCompanySlugs(known: Set<string>): Map<string, string> {
  const canonical = new Map<string, string>();
  for (const slug of known) {
    const target = companySlugVariants(slug)
      .filter((v) => known.has(v))
      .sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    canonical.set(slug, target ?? slug);
  }
  return canonical;
}

export function buildCompanyIndex(rows: Row[], now = Date.now()): CompanyIndex {
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const accs = new Map<string, Acc>();

  const known = new Set<string>();
  for (const row of rows) {
    const name = row.company?.trim();
    if (name && !isSchool(name)) known.add(slugify(name));
  }
  known.delete("");
  const canonical = canonicalCompanySlugs(known);

  for (const row of rows) {
    const name = row.company?.trim();
    if (!name || isSchool(name)) continue;
    const slug = canonical.get(slugify(name));
    if (!slug) continue;
    let acc = accs.get(slug);
    if (!acc) {
      acc = { labels: new Map(), count: 0, byType: { alternance: 0, stage: 0 }, ids: [], recent7d: 0, cities: new Map(), metiers: new Map(), salaries: [], latest: null };
      accs.set(slug, acc);
    }
    acc.labels.set(name, (acc.labels.get(name) ?? 0) + 1);
    acc.count += 1;
    acc.byType[row.contract_type] += 1;
    if (acc.ids.length < MAX_IDS) acc.ids.push(row.id);
    if (new Date(row.published_at).getTime() >= weekAgo) acc.recent7d += 1;
    if (!acc.latest || row.published_at > acc.latest) acc.latest = row.published_at;

    const cityKey = row.location ? normalizeCityKey(row.location) : "";
    const citySlug = cityKey ? slugify(cityKey) : "";
    if (citySlug && !NOT_A_CITY.has(citySlug)) {
      const c = acc.cities.get(citySlug) ?? { label: titleCase(cityKey), count: 0 };
      c.count += 1;
      acc.cities.set(citySlug, c);
    }
    const metier = classifyMetier(row.title);
    if (metier) {
      const m = acc.metiers.get(metier.slug) ?? { label: metier.label, count: 0 };
      m.count += 1;
      acc.metiers.set(metier.slug, m);
    }
    if (row.source !== "adzuna") {
      const salary = parseMonthlySalary(row.salary);
      if (salary !== null) acc.salaries.push(salary);
    }
  }

  const companies: Record<string, CompanyEntry> = {};
  for (const [slug, acc] of accs) {
    if (acc.count < PAGE_MIN_OFFERS) continue;
    // Nom affiché : le plus fréquent parmi ceux qui donnent exactement le
    // slug de la page ("Adecco" plutôt que "Adecco France"), sinon le plus
    // fréquent tout court.
    const labels = [...acc.labels.entries()].sort((a, b) => b[1] - a[1]);
    const label = (labels.find(([l]) => slugify(l) === slug) ?? labels[0])[0];
    const sorted = [...acc.salaries].sort((a, b) => a - b);
    companies[slug] = {
      slug,
      label,
      count: acc.count,
      byType: acc.byType,
      ids: acc.ids,
      recent7d: acc.recent7d,
      latest: acc.latest,
      cities: top(acc.cities, 8),
      metiers: top(acc.metiers, 8),
      salaryMedian: sorted.length >= SALARY_MIN_SAMPLE ? sorted[Math.floor(sorted.length / 2)] : null,
      salaryN: sorted.length,
    };
  }
  const aliases: Record<string, string> = {};
  for (const [slug, target] of canonical) {
    if (slug !== target && companies[target]) aliases[slug] = target;
  }
  return { generatedAt: new Date(now).toISOString(), companies, aliases };
}

async function computeCompanyIndex(): Promise<CompanyIndex> {
  const supabase = createPublicClient();
  const rows = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("offers")
      .select("id, title, company, location, contract_type, salary, published_at, source")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return buildCompanyIndex(rows);
}

type CompactCompanyIndex = Omit<CompanyIndex, "companies"> & { companies: Record<string, Compacted<CompanyEntry>>; idTable: string[] };

// Version mise en cache : ids compactés (voir compactIds.ts).
async function computeCompactCompanyIndex(): Promise<CompactCompanyIndex> {
  const index = await computeCompanyIndex();
  return fitCacheBudget((maxIds) => {
    const encoder = idEncoder();
    return { ...index, companies: compactGroup(index.companies, encoder, maxIds), idTable: encoder.table };
  }, `company index: ${Object.keys(index.companies).length} entreprises`);
}

const cachedCompanyIndex = unstable_cache(computeCompactCompanyIndex, ["company-index-v9"], { revalidate: 3600 });

let expanded: CompanyIndex | null = null;

export async function getCompanyIndex(): Promise<CompanyIndex> {
  const compact = await cachedCompanyIndex();
  if (expanded && expanded.generatedAt === compact.generatedAt) return expanded;
  expanded = { generatedAt: compact.generatedAt, companies: expandGroup(compact.companies, unpackIdTable(compact.idTable)), aliases: compact.aliases ?? {} };
  return expanded;
}

export function companySlug(company: string): string {
  return slugify(company.trim());
}

// Page entreprise d'un nom tel qu'il apparaît dans une offre ("Adecco
// France" -> page /entreprises/adecco).
export function findCompany(index: CompanyIndex, company: string): CompanyEntry | undefined {
  const slug = companySlug(company);
  return index.companies[index.aliases[slug] ?? slug];
}

// Idem pour une liste de noms, sans doublon ("Adecco" et "Adecco France"
// donnent une seule page).
export function findCompanies(index: CompanyIndex, companies: string[]): CompanyEntry[] {
  const seen = new Set<string>();
  const out: CompanyEntry[] = [];
  for (const name of companies) {
    const entry = findCompany(index, name);
    if (entry && !seen.has(entry.slug)) {
      seen.add(entry.slug);
      out.push(entry);
    }
  }
  return out;
}
