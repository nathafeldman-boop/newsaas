import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";
import type { ContractType } from "@/types/database";

export const dynamic = "force-dynamic";

// Pages programmatiques indexables uniquement (>= INDEXABLE_MIN_OFFERS
// offres) : les pages 3-9 offres existent mais sont en noindex, inutile de
// les signaler à Google.
async function entriesFor(type: ContractType): Promise<SitemapEntry[]> {
  const index = await getProgrammaticIndex(type);
  const lastModified = index.generatedAt;
  const keep = (count: number) => count >= INDEXABLE_MIN_OFFERS;
  return [
    { path: `/${type}`, lastModified },
    ...Object.values(index.metiers)
      .filter((m) => keep(m.count))
      .map((m) => ({ path: `/${type}/${m.slug}`, lastModified })),
    ...Object.values(index.cities)
      .filter((c) => keep(c.count))
      .map((c) => ({ path: `/${type}/${c.slug}`, lastModified })),
    ...Object.values(index.combos)
      .filter((c) => keep(c.count))
      .map((c) => ({ path: `/${type}/${c.metier}/${c.city}`, lastModified })),
  ];
}

export async function GET() {
  const [alternance, stage] = await Promise.all([entriesFor("alternance"), entriesFor("stage")]);
  return xmlResponse(urlsetXml([...alternance, ...stage]));
}
