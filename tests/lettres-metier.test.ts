// Lettres sans IA (30/10) : 60 métiers × 2 styles, mots-clés de l'annonce, passages à compléter.
// Lancer : npx tsx --tsconfig tsconfig.json tests/lettres-metier.test.ts
import assert from "node:assert/strict";
import { METIERS } from "../src/lib/seo/metiers";
import { METIER_PACKS } from "../src/lib/coverLetter/metierPacks";
import { buildMetierLetter, generateMetierLetter, offerKeywords, metierPackFor } from "../src/lib/coverLetter/metierLetter";
import { countPlaceholders, placeholdersIn } from "../src/lib/coverLetter/templates";

// Chaque métier du site a sa fiche, et rien de plus.
assert.deepEqual(Object.keys(METIER_PACKS).sort(), METIERS.map((m) => m.slug).sort());

let templates = 0;
for (const [slug, pack] of Object.entries(METIER_PACKS)) {
  assert.ok(pack.missions.length > 30 && !/[.]$/.test(pack.missions), `${slug} : missions`);
  assert.ok(/[.!]$/.test(pack.motive), `${slug} : motive finit par un point`);
  assert.equal(new Set(pack.keywords).size, pack.keywords.length, `${slug} : mots-clés en double`);
  assert.ok(pack.keywords.every((k) => k === k.toLowerCase() && !/[À-ÿ]/.test(k)), `${slug} : mots-clés sans accents ni majuscules`);
  for (const style of ["classique", "directe"] as const) {
    for (const contract of ["alternance", "stage"]) {
      const offer = { title: "Assistant en " + contract, company: "Maison Dupont", description: "Missions variées.", requirements: null, contract_type: contract } as never;
      const letter = buildMetierLetter(pack, offer, { full_name: "Léa Martin", formation: "BTS MCO", education_level: "Bac+2" } as never, style);
      assert.doesNotMatch(letter, /undefined|null|NaN|\s{3,}|\(e\)|  /, `${slug} ${style} ${contract}`);
      assert.match(letter, /^Madame, Monsieur,/);
      assert.match(letter, /Léa Martin$/);
      assert.match(letter, /Maison Dupont/);
      assert.match(letter, new RegExp(contract === "alternance" ? "en alternance" : "en stage"));
      // Formation connue : seuls l'expérience et le rythme ou les dates restent à compléter.
      assert.ok(countPlaceholders(letter) >= 2 && countPlaceholders(letter) <= 3, `${slug} ${style} : ${countPlaceholders(letter)} passages`);
      if (contract === "alternance") templates++;
    }
  }
}
assert.equal(templates, 120);

// Exemple réel : vendeur, profil sans formation renseignée, annonce qui cite l'encaissement et le merchandising.
const vendeur = {
  title: "Vendeur en alternance (H/F)",
  company: "Intersport",
  description: "Vous participez à l'accueil, au Merchandising et à l'encaissement. Une première expérience en CRM est un plus.",
  requirements: null,
  contract_type: "alternance",
};
assert.equal(metierPackFor(vendeur.title)?.slug, "vente");
const letter = generateMetierLetter(vendeur as never, { full_name: "Léa Martin", formation: null, education_level: null } as never, "classique")!;
assert.match(letter, /poste de vendeur en alternance chez Intersport/);
assert.match(letter, /techniques de vente et merchandising, notamment encaissement, que vous citez dans votre annonce/);
assert.deepEqual(placeholdersIn(letter).map((p) => p.split(",")[0]), [
  "ta formation",
  "Ajoute une expérience concrète : un job",
  "ton rythme",
  "date de début",
]);
// Avec une réalisation et une raison : plus de crochet pour l'expérience, et la raison apparaît.
const filled = generateMetierLetter(vendeur as never, { full_name: "Léa Martin", formation: "BTS MCO", education_level: "Bac+2" } as never, "directe", {
  achievement: "j'ai été vendeuse saisonnière chez Decathlon pendant deux étés",
  whyCompany: "j'aime le sport et votre magasin de Lyon",
})!;
assert.match(filled, /Par exemple : j'ai été vendeuse saisonnière chez Decathlon pendant deux étés\./);
assert.match(filled, /Pourquoi Intersport \? J'aime le sport et votre magasin de Lyon\./);
assert.equal(countPlaceholders(filled), 2);
assert.match(filled, /Ma formation \(BTS MCO\) me prépare à ce poste/);
// Élision et sigles.
assert.match(generateMetierLetter({ ...vendeur, title: "Assistant commercial en alternance" } as never, null, "classique")!, /poste d'assistant commercial/);
assert.deepEqual(offerKeywords(METIER_PACKS.data, "Maîtrise de SQL et Power BI, Python apprécié"), ["Python", "Power BI"]);
// Offre sans métier reconnu : pas de modèle (le générateur par famille prend le relais).
assert.equal(generateMetierLetter({ ...vendeur, title: "Poste polyvalent" } as never, null, "classique"), null);

console.log("lettres-metier.test.ts OK (120 modèles)");
