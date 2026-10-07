import { GUIDES } from "@/lib/guides/guidesData";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Contenu éditorial et outils, séparés des pages d'offres : Search Console
// montre ainsi l'indexation des guides à part (audit SEO du 07/10).
export async function GET() {
  const entries: SitemapEntry[] = [
    { path: "/guides" },
    ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, lastModified: guide.updatedAt })),
    { path: "/outils/simulateur-salaire-alternance" },
    { path: "/outils/lettre-de-motivation-alternance" },
    { path: "/outils/lettre-de-motivation-stage" },
    { path: "/outils/cv-alternance" },
    { path: "/outils/cv-stage" },
    { path: "/barometre-alternance-stage" },
  ];
  return xmlResponse(urlsetXml(entries));
}
