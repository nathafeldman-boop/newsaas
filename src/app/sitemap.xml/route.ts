import { SITEMAP_FILES, sitemapIndexXml, xmlResponse } from "@/lib/seo/sitemapXml";

// Index : c'est l'URL déjà déclarée dans robots.txt et Search Console, elle
// pointe désormais vers les sitemaps segmentés (voir lib/seo/sitemapXml.ts).
export function GET() {
  return xmlResponse(sitemapIndexXml(SITEMAP_FILES));
}
