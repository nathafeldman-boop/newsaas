// Publications LinkedIn (01/11) : textes exacts, liens UTM, anti-doublon d'entreprise.
// Lancer : npx tsx --tsconfig tsconfig.json tests/linkedin.test.ts
import assert from "node:assert/strict";
import { cleanTitle, composePost, displayCompany, utmCampaign, withUtm, LINKEDIN_MAX_CHARS } from "../src/lib/linkedin/compose";
import { completenessScore, diversify, isPublishable, type Candidate } from "../src/lib/linkedin/select";
import { CITY_TARGETS, SECTOR_GROUPS } from "../src/lib/linkedin/formats";
import { METIERS } from "../src/lib/seo/metiers";
import { SECTORS } from "../src/lib/onboarding/options";

// Titres et entreprises
assert.equal(cleanTitle("Assistant / Assistante RH (H/F)"), "Assistant / Assistante RH");
assert.equal(cleanTitle("Chargé de communication [F/H] alternance"), "Chargé de communication alternance");
assert.equal(cleanTitle("Stage - Assistant RH H/F/NB"), "Stage - Assistant RH");
assert.equal(cleanTitle("MAV spécialisé Communication Digitale- Contrat en alternance (H/F (H/F)"), "MAV spécialisé Communication Digitale- Contrat en alternance");
assert.equal(cleanTitle("ALTERNANT MONITEUR DE SKI ET CHARGÉ MARKETING/COMMUNICATION - H/F"), "Alternant moniteur de ski et chargé marketing/communication");
assert.equal(cleanTitle("Alternant(e) Webmarketing, SEO & E-commerce Entreprise (H/F)"), "Alternant(e) Webmarketing, SEO & E-commerce Entreprise");
// Noms d'entreprise jamais réécrits (« Saint-Gobain » ne se devine pas depuis des capitales).
assert.equal(displayCompany("COMPAGNIE DE SAINT-GOBAIN"), "COMPAGNIE DE SAINT-GOBAIN");

// Offres non publiables : entreprise non nommée, organisme de formation, intitulé « stage ».
assert.equal(isPublishable({ title: "Chargé de communication", company: "On ne recrute pas" }), false);
assert.equal(isPublishable({ title: "Commercial", company: "ETABLISSEMENT PUBLIC LOCAL D'ENSEIGNEMEN" }), false);
assert.equal(isPublishable({ title: "STAGE - ASSISTANT CHEF DE PROJET", company: "NRJ GROUP" }), false);
assert.equal(isPublishable({ title: "Stage ou alternance assistant RH", company: "ACME" }), true);
assert.equal(isPublishable({ title: "Growth hacker (H/F)", company: "MEDIA-START" }), true);

// UTM
const date = new Date("2026-11-01T16:10:00Z");
assert.equal(utmCampaign("jour", null, date), "jour-20261101");
assert.equal(utmCampaign("secteur", "marketing", date), "secteur-marketing-20261101");
const url = withUtm("https://www.stageio.fr/offres/x-123", "jour-20261101");
assert.equal(new URL(url).searchParams.get("utm_source"), "linkedin");
assert.equal(new URL(url).searchParams.get("utm_campaign"), "jour-20261101");

// Texte : chaque fait vient de l'offre, chaque lien est présent.
const offers = Array.from({ length: 10 }, (_, i) => ({
  id: `id-${i}`,
  title: `Assistant marketing digital numéro ${i} (H/F)`,
  company: `ENTREPRISE TEST ${i}`,
  city: "Lyon",
  duration: i % 2 ? "12 mois" : null,
  url: `https://www.stageio.fr/offres/o-${i}?utm_source=linkedin&utm_medium=social&utm_campaign=hebdo-20261101`,
}));
const base = {
  segment: null,
  moreUrl: "https://www.stageio.fr/offres/alternance?utm_source=linkedin",
  extraHashtag: null,
  checkedAt: date,
  allVerified: true,
  linksInComment: false,
};
const hebdo = composePost({ ...base, format: "hebdo", offers });
assert.ok(hebdo.body.length <= LINKEDIN_MAX_CHARS, `trop long : ${hebdo.body.length}`);
for (const o of offers) assert.ok(hebdo.body.includes(o.url), "lien manquant");
assert.ok(hebdo.body.includes("Les 10 alternances"));
assert.ok(hebdo.body.includes("✅ Offres vérifiées le 01/11/2026 à 17 h 10"));
assert.ok(hebdo.body.includes("Source des annonces : France Travail"));
assert.ok(!hebdo.body.includes("(H/F)"));
assert.equal(hebdo.firstComment, null);

// Vérification incomplète : on n'écrit pas « vérifiées ».
const partial = composePost({ ...base, format: "jour", offers: offers.slice(0, 5), allVerified: false });
assert.ok(!partial.body.includes("vérifiées"));
assert.ok(partial.body.includes("Offres en ligne sur Stageio le 01/11/2026"));

// Liens en commentaire
const inComment = composePost({ ...base, format: "jour", offers: offers.slice(0, 5), linksInComment: true });
for (const o of offers.slice(0, 5)) {
  assert.ok(!inComment.body.includes(o.url));
  assert.ok(inComment.firstComment?.includes(o.url));
}

// Secteur et ville
const sector = composePost({ ...base, format: "secteur", segment: "Marketing et communication", extraHashtag: "#marketing", offers: offers.slice(0, 5) });
assert.ok(sector.body.startsWith("🎯 Alternance en marketing et communication : 5 alternances"));
assert.ok(sector.body.includes("#marketing"));
const ville = composePost({ ...base, format: "ville", segment: "Saint-Étienne", offers: offers.slice(0, 1) });
assert.ok(ville.body.startsWith("📍 Alternance à Saint-Étienne : 1 alternance en ce moment"));
assert.ok(ville.body.includes("#SaintEtienne"));

// Diversité : une offre par entreprise, au plus N par ville.
const c = (id: string, company: string, cityKey: string): Candidate => ({
  id, title: "t", company, location: cityKey, city: cityKey, cityKey, sector: null, duration: null, salary: null,
  start_date: null, quality_score: 50, created_at: "2026-11-01", inDraft: false,
});
const div = diversify([c("1", "ACME", "paris"), c("2", "acme", "lyon"), c("3", "B", "paris"), c("4", "C", "paris")], { maxPerCity: 2 });
assert.deepEqual(div.map((d) => d.id), ["1", "3"]);
assert.ok(completenessScore({ quality_score: 50, salary: "1 000 €", duration: null, start_date: null }) > completenessScore({ quality_score: 50, salary: null, duration: null, start_date: null }));

// Les secteurs regroupés existent dans la taxonomie, et chaque page cible existe.
const known = new Set<string>(SECTORS);
for (const g of SECTOR_GROUPS) {
  for (const s of g.sectors) assert.ok(known.has(s), `secteur inconnu : ${s}`);
  const slug = g.hubPath.replace("/alternance/", "");
  assert.ok(METIERS.some((m) => m.slug === slug), `page métier inexistante : ${g.hubPath}`);
}
assert.equal(new Set(CITY_TARGETS.map((x) => x.key)).size, CITY_TARGETS.length);

console.log("linkedin.test.ts : OK");
