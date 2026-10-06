import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Pages entreprise indexables uniquement (>= INDEXABLE_MIN_OFFERS offres).
export async function GET() {
  const index = await getCompanyIndex();
  const lastModified = index.generatedAt;
  return xmlResponse(
    urlsetXml([
      { path: "/entreprises", lastModified },
      ...Object.values(index.companies)
        .filter((c) => c.count >= INDEXABLE_MIN_OFFERS)
        .map((c) => ({ path: `/entreprises/${c.slug}`, lastModified })),
    ]),
  );
}
