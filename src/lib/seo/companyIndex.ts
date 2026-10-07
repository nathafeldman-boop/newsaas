import { unstable_cache } from "next/cache";
import { compactGroup, expandGroup, idEncoder, serializedKb, type Compacted } from "@/lib/seo/compactIds";
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

export type CompanyIndex = { generatedAt: string; companies: Record<string, CompanyEntry> };

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

export function buildCompanyIndex(rows: Row[], now = Date.now()): CompanyIndex {
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const accs = new Map<string, Acc>();

  for (const row of rows) {
    const name = row.company?.trim();
    if (!name || isSchool(name)) continue;
    const slug = slugify(name);
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
    const label = [...acc.labels.entries()].sort((a, b) => b[1] - a[1])[0][0];
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
  return { generatedAt: new Date(now).toISOString(), companies };
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
  const encoder = idEncoder();
  const compact = { ...index, companies: compactGroup(index.companies, encoder), idTable: encoder.table };
  console.log(`company index: ${Object.keys(index.companies).length} entreprises, ${serializedKb(compact)} Ko`);
  return compact;
}

const cachedCompanyIndex = unstable_cache(computeCompactCompanyIndex, ["company-index-v5"], { revalidate: 3600 });

let expanded: CompanyIndex | null = null;

export async function getCompanyIndex(): Promise<CompanyIndex> {
  const compact = await cachedCompanyIndex();
  if (expanded && expanded.generatedAt === compact.generatedAt) return expanded;
  expanded = { generatedAt: compact.generatedAt, companies: expandGroup(compact.companies, compact.idTable) };
  return expanded;
}

export function companySlug(company: string): string {
  return slugify(company.trim());
}
