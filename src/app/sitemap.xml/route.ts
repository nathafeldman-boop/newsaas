import { latestOfferCreatedAt } from "@/lib/offers/sitemapOffers";
import { SITEMAP_FILES, sitemapIndexXml, xmlResponse } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Index : c'est l'URL déjà déclarée dans robots.txt et Search Console, elle
// pointe désormais vers les sitemaps segmentés (voir lib/seo/sitemapXml.ts).
// <lastmod> sur les sitemaps d'offres (arrivée de la dernière offre) : Google
// sait ainsi lesquels relire sans tout retélécharger.
export async function GET() {
  const [alternance, stage, cdi, cdd, all] = await Promise.all([
    latestOfferCreatedAt("alternance"),
    latestOfferCreatedAt("stage"),
    latestOfferCreatedAt("cdi"),
    latestOfferCreatedAt("cdd"),
    latestOfferCreatedAt(),
  ]);
  const lastmod: Record<string, string | null> = {
    "/sitemap-offres-alternance.xml": alternance,
    "/sitemap-offres-stage.xml": stage,
    "/sitemap-offres-cdi.xml": cdi,
    "/sitemap-offres-cdd.xml": cdd,
    "/sitemap-offres-recentes.xml": all,
  };
  return xmlResponse(sitemapIndexXml(SITEMAP_FILES.map((path) => ({ path, lastModified: lastmod[path] ?? null }))));
}
