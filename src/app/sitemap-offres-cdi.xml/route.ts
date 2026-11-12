import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { INDEXABLE_CONTRACT_CITY_MIN, getContractCitySegments } from "@/lib/offers/contractCitySegments";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Fiches CDI : sans ce sitemap, Google ne voyait une offre CDI que pendant
// ses 72 h dans /sitemap-offres-recentes.xml (12/11 : ~3 950 fiches hors sitemap).
// Plus les pages « CDI débutant à <ville> » indexables (/offres/cdi/[ville]).
export async function GET() {
  const [offers, cities] = await Promise.all([fetchOfferSitemapEntries("cdi"), getContractCitySegments("cdi")]);
  const cityEntries = cities
    .filter((c) => c.count >= INDEXABLE_CONTRACT_CITY_MIN)
    .map((c) => ({ path: `/offres/cdi/${c.slug}` }));
  return xmlResponse(urlsetXml([...cityEntries, ...offers]));
}
