import { fetchSeoOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { urlsetXml, xmlResponse } from "@/lib/seo/sitemapXml";

// Une tranche des fiches CDI/CDD importées pour Google (voir
// fetchSeoOfferSitemapEntries) : app/sitemap-emplois-<x>.xml/route.ts.
export async function seoEmploisSitemapResponse(bucket: string): Promise<Response> {
  return xmlResponse(urlsetXml(await fetchSeoOfferSitemapEntries(bucket)));
}
