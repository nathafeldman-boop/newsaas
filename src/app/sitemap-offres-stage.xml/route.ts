import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

export async function GET() {
  return xmlResponse(urlsetXml(await fetchOfferSitemapEntries("stage")));
}
