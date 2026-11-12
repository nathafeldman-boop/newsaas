// Sitemaps des fiches CDI et CDD (12/11) : sans eux, Google ne voyait une
// offre CDI/CDD que pendant ses 72 h dans /sitemap-offres-recentes.xml.
// Lancer : npx tsx --tsconfig tsconfig.json tests/sitemap-cdi-cdd.test.ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { SITEMAP_FILES } from "../src/lib/seo/sitemapXml";

for (const type of ["cdi", "cdd"]) {
  const path = `/sitemap-offres-${type}.xml`;
  assert.ok(SITEMAP_FILES.includes(path), `${path} dans l'index`);
  const route = `src/app${path}/route.ts`;
  assert.ok(existsSync(route), `${route} existe`);
  assert.match(readFileSync(route, "utf8"), new RegExp(`fetchOfferSitemapEntries\\("${type}"\\)`));
  assert.match(readFileSync("src/app/sitemap.xml/route.ts", "utf8"), new RegExp(`"${path.replace(/\./g, "\\.")}": ${type}`), `lastmod ${type}`);
}
console.log("sitemap-cdi-cdd : ok");
