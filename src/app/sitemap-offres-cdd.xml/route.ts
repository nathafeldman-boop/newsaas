import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Fiches CDD : sans ce sitemap, Google ne voyait une offre CDD que pendant
// ses 72 h dans /sitemap-offres-recentes.xml (12/11 : ~1 890 fiches hors sitemap).
export async function GET() {
  return xmlResponse(urlsetXml(await fetchOfferSitemapEntries("cdd")));
}
