// Import pour Google seulement (27/11) : CDI/CDD avec ou sans expérience,
// par département et par jour, marqués seo_only ; le flux débutants
// écrit seo_only = false.
// Lancer : npx tsx --tsconfig tsconfig.json tests/seo-emplois.test.ts
import assert from "node:assert/strict";
import { emploisQueries, seoDayIndex, SEO_DAYS } from "../src/lib/franceTravail/emploisSync";
import { toOfferRows } from "../src/lib/franceTravail/sync";
import { DEPARTEMENTS } from "../src/lib/seo/departements";
import { SEO_SITEMAP_BUCKETS } from "../src/lib/offers/sitemapOffers";
import { SITEMAP_FILES } from "../src/lib/seo/sitemapXml";
import type { FranceTravailJob } from "../src/lib/franceTravail/client";

const now = Date.parse("2026-11-28T10:37:00Z");
const day = seoDayIndex(now);
assert.ok(day >= 0 && day < SEO_DAYS);
const queries = emploisQueries("seo", now);
assert.equal(queries.length, DEPARTEMENTS.length * 2);
for (const q of queries) {
  assert.equal(q.experience, undefined, "pas de filtre d'expérience");
  assert.ok(q.departement);
  assert.equal(Date.parse(q.maxCreationDate!) - Date.parse(q.minCreationDate!), 86_400_000);
}
// Les passages horaires parcourent tous les jours.
const seen = new Set(Array.from({ length: 48 }, (_, h) => seoDayIndex(now + h * 3_600_000)));
assert.equal(seen.size, SEO_DAYS);
// Le flux débutants garde son filtre.
assert.ok(emploisQueries("full", now).every((q) => q.experience === "1"));

const job: FranceTravailJob = {
  id: "300XYZ",
  intitule: "Comptable confirmé (H/F)",
  description: "Tenue de la comptabilité, 3 ans d'expérience.",
  dateCreation: "2026-11-27T09:00:00Z",
  lieuTravail: { libelle: "69 - Lyon 3e" },
  origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/recherche/detail/300XYZ" },
  typeContrat: "CDI",
};
const t = new Date(now).toISOString();
assert.equal(toOfferRows([job], t, { emploi: true, seoOnly: true })[0].seo_only, true);
assert.equal(toOfferRows([job], t, { emploi: true })[0].seo_only, false);
const alt = { ...job, id: "300ALT", intitule: "Comptable en alternance (H/F)" };
assert.equal("seo_only" in toOfferRows([alt], t)[0], false, "synchros alternance/stage inchangées");

assert.equal(SEO_SITEMAP_BUCKETS.length, 16);
assert.equal(SITEMAP_FILES.filter((f) => f.startsWith("/sitemap-emplois-")).length, 16);
console.log("seo-emplois : ok");
