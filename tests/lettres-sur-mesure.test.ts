// Lettres sur mesure (31/10) : missions de l'annonce, voix du métier, profil ; Auto sans crochets.
// Lancer : npx tsx --tsconfig tsconfig.json tests/lettres-sur-mesure.test.ts
import assert from "node:assert/strict";
import { METIERS, classifyMetier } from "../src/lib/seo/metiers";
import { METIER_VOICES } from "../src/lib/coverLetter/metierVoice";
import { generateTailoredLetter } from "../src/lib/coverLetter/tailoredLetter";
import { cleanCity, extractMissions, extractRythme, extractStartDate } from "../src/lib/coverLetter/offerDetails";
import { countPlaceholders } from "../src/lib/coverLetter/templates";

const NOW = Date.UTC(2026, 9, 31, 12);

// Une voix pour chaque métier du site.
assert.deepEqual(Object.keys(METIER_VOICES).sort(), METIERS.map((m) => m.slug).sort());
for (const [slug, v] of Object.entries(METIER_VOICES)) {
  for (const t of [...v.hooks, v.closing]) {
    assert.ok(!/\(e\)|j'ai (déjà|codé|fait)|depuis toujours|mon portfolio|mon book/i.test(t), `${slug} : pas d'expérience inventée : ${t}`);
    assert.match(t, /[.!?]$/, `${slug} : phrase complète`);
  }
  assert.ok(!/[.]$/.test(v.early) && !/[.]$/.test(v.proof), `${slug} : early/proof sans point final`);
}

// Annonce : missions, date, rythme, ville.
assert.deepEqual(extractMissions("Vos missions :\n- Accueillir et conseiller notre clientèle\n- Assurer l'encaissement\n- Ranger"), [
  "accueillir et conseiller votre clientèle",
  "assurer l'encaissement",
]);
assert.deepEqual(extractMissions("Au sein de l'équipe, vous serez amené(e) à développer de nouvelles fonctionnalités sur nos applications React. Stack : Node."), [
  "développer de nouvelles fonctionnalités sur vos applications React",
]);
assert.deepEqual(extractMissions("Poste polyvalent, bonne humeur exigée. Notre entreprise est leader."), []);
assert.equal(extractStartDate("Début : septembre 2026.", null, NOW), "septembre 2026");
assert.equal(extractStartDate("Démarrage dès le 01/09/2027", null, NOW), "septembre 2027");
assert.equal(extractStartDate("Rien ici", "2026-11-15", NOW), "novembre 2026");
assert.equal(extractStartDate("Rien ici", null, NOW), null);
assert.equal(extractRythme("Rythme : 2 jours école / 3 jours entreprise."), "2 jours école / 3 jours entreprise");
assert.equal(cleanCity("69 - LYON 03"), "Lyon");
assert.equal(cleanCity("Paris 11e"), "Paris");
assert.equal(cleanCity("13 - AIX-EN-PROVENCE"), "Aix-en-Provence");
assert.equal(cleanCity("Télétravail"), null);

// Toutes les lettres : Auto sans aucun crochet, assist avec des passages guidés, sans « (e) » ni espaces doubles.
const profiles = [
  null,
  { full_name: "Léa Martin", formation: "BTS MCO", city: "Lyon", skills: ["Relation client", "Excel"], availability_date: "2026-09-01", mobility: null },
  { full_name: "Yanis B.", formation: null, city: "Lille", skills: [], availability_date: null, mobility: null },
];
let letters = 0;
let covered = 0;
for (const m of METIERS) {
  const title = `${m.label} en alternance (H/F)`;
  if (classifyMetier(title)?.slug !== m.slug) continue;
  covered++;
  for (const profile of profiles) {
    for (const style of ["classique", "directe"] as const) {
      for (const mode of ["assist", "auto"] as const) {
        const offer = {
          title,
          company: "Entreprise Test",
          description: "Vos missions :\n- Participer à la vie de l'équipe\nDébut : septembre 2026.",
          requirements: null,
          contract_type: "alternance" as const,
          location: "69 - LYON 03",
          start_date: null,
        };
        const letter = generateTailoredLetter(offer, profile, { style, mode, now: NOW });
        letters++;
        const where = `${m.slug} ${style} ${mode} ${profile?.full_name ?? "sans profil"}`;
        if (mode === "auto") assert.equal(countPlaceholders(letter), 0, `${where} : crochet dans une lettre Auto\n${letter}`);
        else assert.ok(countPlaceholders(letter) >= 2, `${where} : passages à compléter`);
        assert.ok(!/\(e\)|\s{3,}| \.|\.\.|,,| ,/.test(letter.replace(/\n\n/g, "¶")), `${where} : ponctuation\n${letter}`);
        const words = letter.split(/\s+/).length;
        assert.ok(words >= 90 && words <= 340, `${where} : ${words} mots`);
      }
    }
  }
}
assert.ok(covered >= 40, `métiers testés : ${covered}`);

// Exemple complet : missions et ville de l'annonce, profil repris, rien d'inventé.
const vendeur = generateTailoredLetter(
  {
    title: "Vendeur en alternance (H/F)",
    company: "Boulangerie Martin",
    description: "Missions :\n- Accueillir et conseiller notre clientèle\n- Assurer l'encaissement\nRythme : 2 jours école / 3 jours entreprise.",
    requirements: null,
    contract_type: "alternance",
    location: "69 - LYON 03",
    start_date: null,
  },
  profiles[1],
  { style: "classique", mode: "auto", now: NOW },
);
assert.match(vendeur, /accueillir et conseiller votre clientèle/);
assert.match(vendeur, /chez Boulangerie Martin, à Lyon/);
assert.match(vendeur, /ma formation en BTS MCO/);
assert.match(vendeur, /J'habite à Lyon\. Je suis disponible dès maintenant\./);
assert.match(vendeur, /Je peux passer au magasin/);
assert.equal(vendeur.match(/relation client/gi)?.length ?? 0, 1, "compétence citée une seule fois");

console.log(`OK (${letters} lettres, ${covered} métiers)`);
