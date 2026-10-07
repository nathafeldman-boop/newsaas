import { SITE_URL } from "@/lib/site";

// Sitemaps servis par des Route Handlers plutôt que par app/sitemap.ts :
// generateSitemaps() de Next ne produit PAS de fichier index, et place les
// fichiers sous /<dossier>/sitemap/<id>.xml -- or un sitemap ne peut
// référencer que des URLs situées sous son propre dossier. Ici, tout est à
// la racine : /sitemap.xml (index) -> /sitemap-pages.xml,
// /sitemap-offres-alternance.xml, /sitemap-offres-stage.xml. Segmenter par
// type permet de suivre l'indexation de chaque famille séparément dans
// Search Console (Indexation > Sitemaps).

export type SitemapEntry = { path: string; lastModified?: string | null };

// Limite du protocole : 50 000 URLs par fichier. Au-delà, découper le type
// concerné en plusieurs fichiers (alternance-1, alternance-2...).
export const SITEMAP_MAX_URLS = 50_000;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toW3cDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const urls = entries
    .slice(0, SITEMAP_MAX_URLS)
    .map((entry) => {
      const lastmod = toW3cDate(entry.lastModified);
      return `<url><loc>${escapeXml(`${SITE_URL}${entry.path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function sitemapIndexXml(paths: string[]): string {
  const sitemaps = paths
    .map((path) => `<sitemap><loc>${escapeXml(`${SITE_URL}${path}`)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}

// Mis en cache 1 h par le CDN Vercel (s-maxage) au lieu d'être générés au
// build : un build ne doit jamais échouer parce que Supabase est lent, et
// Googlebot ne doit pas déclencher ~6 requêtes Supabase à chaque lecture.
export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const SITEMAP_FILES = [
  "/sitemap-pages.xml",
  "/sitemap-guides.xml",
  "/sitemap-metiers-villes.xml",
  "/sitemap-territoires.xml",
  "/sitemap-entreprises.xml",
  "/sitemap-offres-alternance.xml",
  "/sitemap-offres-stage.xml",
];
