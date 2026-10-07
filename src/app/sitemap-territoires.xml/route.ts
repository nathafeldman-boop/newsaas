import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { departementPath } from "@/lib/seo/programmaticPage";
import { regionPath } from "@/lib/seo/regionPage";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";
import type { ContractType } from "@/types/database";

export const dynamic = "force-dynamic";

// Pages département et région (avec ou sans métier), indexables seulement
// (>= INDEXABLE_MIN_OFFERS offres). Séparées des pages métier / ville pour
// suivre leur indexation à part dans Search Console.
async function entriesFor(type: ContractType): Promise<SitemapEntry[]> {
  const index = await getProgrammaticIndex(type);
  const lastModified = index.generatedAt;
  const keep = (count: number) => count >= INDEXABLE_MIN_OFFERS;
  return [
    ...Object.values(index.regions)
      .filter((r) => keep(r.count))
      .map((r) => ({ path: regionPath(type, r.slug, null), lastModified })),
    ...Object.values(index.regionCombos)
      .filter((c) => keep(c.count))
      .map((c) => ({ path: regionPath(type, c.region, c.metier), lastModified })),
    ...Object.values(index.departements)
      .filter((d) => keep(d.count))
      .map((d) => ({ path: departementPath(type, d.slug, null), lastModified })),
    ...Object.values(index.depCombos)
      .filter((c) => keep(c.count) && index.departements[c.dep])
      .map((c) => ({ path: departementPath(type, index.departements[c.dep].slug, c.metier), lastModified })),
  ];
}

export async function GET() {
  const [alternance, stage] = await Promise.all([entriesFor("alternance"), entriesFor("stage")]);
  return xmlResponse(urlsetXml([...alternance, ...stage]));
}
