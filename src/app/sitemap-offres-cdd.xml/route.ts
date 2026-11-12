import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { INDEXABLE_CONTRACT_CITY_MIN, getContractCitySegments } from "@/lib/offers/contractCitySegments";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Fiches CDD : sans ce sitemap, Google ne voyait une offre CDD que pendant
// ses 72 h dans /sitemap-offres-recentes.xml (12/11 : ~1 890 fiches hors sitemap).
// Plus les pages « CDD débutant à <ville> » indexables (/offres/cdd/[ville]).
export async function GET() {
  const [offers, cities] = await Promise.all([fetchOfferSitemapEntries("cdd"), getContractCitySegments("cdd")]);
  const cityEntries = cities
    .filter((c) => c.count >= INDEXABLE_CONTRACT_CITY_MIN)
    .map((c) => ({ path: `/offres/cdd/${c.slug}` }));
  return xmlResponse(urlsetXml([...cityEntries, ...offers]));
}
