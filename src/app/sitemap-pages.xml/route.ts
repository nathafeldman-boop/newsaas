import { getSectorSegments } from "@/lib/offers/segments";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Guides, outils et baromètre : sitemap-guides.xml. /login volontairement absent (noindex) : une page de connexion n'a
// aucune raison d'apparaître dans Google. /offres/ville/* non plus (noindex,
// doublons de /alternance/[ville] et /stage/[ville]).
const STATIC_PATHS = [
  "/",
  "/a-propos",
  "/offres",
  "/offres/alternance",
  "/offres/stage",
  "/alternance/urgent",
  "/inscription",
  "/legal",
  "/legal/mentions-legales",
  "/legal/cgu",
  "/legal/cgv",
  "/legal/confidentialite",
];

export async function GET() {
  const sectorSegments = await getSectorSegments();

  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...sectorSegments.map((segment) => ({ path: `/offres/secteur/${segment.slug}` })),
  ];

  return xmlResponse(urlsetXml(entries));
}
