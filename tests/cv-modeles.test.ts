// Modèles de CV (30/10) : 60 métiers pré-remplis, 6 mises en page × 8 couleurs.
// Lancer : npx tsx --tsconfig tsconfig.json tests/cv-modeles.test.ts
import assert from "node:assert/strict";
import { METIERS } from "../src/lib/seo/metiers";
import { CV_METIERS } from "../src/lib/tools/cvMetiers";
import { CV_METIER_OPTIONS, cvMetierPrefill } from "../src/lib/tools/cvTemplates";
import { CV_COLORS, CV_DESIGN_COUNT, CV_LAYOUTS } from "../src/lib/tools/cvDesigns";
import { EMPTY_CV_INPUT, cvPlaceholders, keywordCoverage } from "../src/lib/tools/cv";

// Chaque métier du site a son contenu, et rien d'autre.
assert.deepEqual(Object.keys(CV_METIERS).sort(), METIERS.map((m) => m.slug).sort());
assert.equal(CV_METIER_OPTIONS.length, 60);
assert.equal(CV_DESIGN_COUNT, CV_LAYOUTS.length * CV_COLORS.length);
assert.equal(CV_DESIGN_COUNT, 48);

for (const [slug, content] of Object.entries(CV_METIERS)) {
  assert.ok(content.skills.length >= 8, `${slug} : 8 compétences`);
  assert.equal(new Set(content.skills.map((s) => s.toLowerCase())).size, content.skills.length, `${slug} : doublon`);
  for (const s of content.skills) assert.match(s, /^[A-ZÀ-ÖØ-Þ0-9]/, `${slug} : « ${s} » commence par une majuscule`);
  for (const contract of ["alternance", "stage"] as const) {
    const p = cvMetierPrefill(slug, contract);
    assert.ok(p, slug);
    assert.ok(p.headline.startsWith(contract === "alternance" ? "Alternance " : "Stage "), p.headline);
    assert.ok(!/\s{2}|\.\./.test(p.summary), `${slug} : ${p.summary}`);
    assert.ok(p.summary.includes("[ta formation]"), p.summary);
  }
}

// Formation connue : plus de crochet pour elle.
const known = cvMetierPrefill("vente", "alternance", "BTS MCO");
assert.ok(known);
assert.equal(known.headline, "Alternance dans la vente – BTS MCO – rentrée [mois et année]");
assert.ok(known.summary.startsWith("En BTS MCO, je cherche une alternance dans la vente pour apprendre à "), known.summary);

// Passages à compléter et mots-clés couverts.
const cv = { ...EMPTY_CV_INPUT, headline: known.headline, summary: known.summary, skills: "Conseil client, encaissement" };
assert.deepEqual(cvPlaceholders(cv), ["mois et année", "Une phrase sur ce que tu apportes : un job, un projet, un engagement."]);
const coverage = keywordCoverage(CV_METIERS.vente.skills, `${cv.skills} merchandising`);
assert.deepEqual(
  coverage.filter((k) => k.present).map((k) => k.keyword),
  ["Conseil client", "Encaissement", "Merchandising"],
);

console.log(`OK (${Object.keys(CV_METIERS).length} métiers, ${CV_DESIGN_COUNT} designs)`);
