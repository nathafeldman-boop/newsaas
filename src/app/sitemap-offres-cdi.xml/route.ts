import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Fiches CDI : sans ce sitemap, Google ne voyait une offre CDI que pendant
// ses 72 h dans /sitemap-offres-recentes.xml (12/11 : ~3 950 fiches hors sitemap).
export async function GET() {
  return xmlResponse(urlsetXml(await fetchOfferSitemapEntries("cdi")));
}
