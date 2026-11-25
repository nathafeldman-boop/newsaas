import { SCHOOL_STAGES, SCHOOL_STAGE_IDS } from "@/lib/schoolStage/levels";
import { SCHOOL_CITY_SLUGS } from "@/lib/schoolStage/cityPage";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Pages « stage de 3e à Lyon »... (25/11) : une par classe et par grande ville.
// Liste fixe (pas d'appel aux sources ici) ; une page sans aucune donnée
// le jour où Google passe est en noindex.
export async function GET() {
  const entries: SitemapEntry[] = SCHOOL_STAGE_IDS.flatMap((level) =>
    SCHOOL_CITY_SLUGS.map((slug) => ({ path: `/${SCHOOL_STAGES[level].slug}/${slug}` })),
  );
  return xmlResponse(urlsetXml(entries));
}
