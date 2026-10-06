import { getSectorSegments, getCitySegments } from "@/lib/offers/segments";
import { GUIDES } from "@/lib/guides/guidesData";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// /login volontairement absent (noindex) : une page de connexion n'a
// aucune raison d'apparaître dans Google.
const STATIC_PATHS = [
  "/",
  "/offres",
  "/offres/alternance",
  "/offres/stage",
  "/guides",
  "/outils/simulateur-salaire-alternance",
  "/inscription",
  "/legal",
  "/legal/mentions-legales",
  "/legal/cgu",
  "/legal/cgv",
  "/legal/confidentialite",
];

export async function GET() {
  const [sectorSegments, citySegments] = await Promise.all([getSectorSegments(), getCitySegments()]);

  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, lastModified: guide.updatedAt })),
    ...sectorSegments.map((segment) => ({ path: `/offres/secteur/${segment.slug}` })),
    ...citySegments.map((segment) => ({ path: `/offres/ville/${segment.slug}` })),
  ];

  return xmlResponse(urlsetXml(entries));
}
