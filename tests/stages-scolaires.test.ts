// Stages scolaires : âge, accord parental, lettre, lien signé, annuaire (18/11).
// Lancer : npx tsx --tsconfig tsconfig.json tests/stages-scolaires.test.ts [réponse-annuaire.json]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ageOn, isSchoolStageLevel, schoolStageLetter, waitsForParent } from "../src/lib/schoolStage/levels";
import { consentLink, verifyConsentParams } from "../src/lib/schoolStage/parentConsent";
import { SCHOOL_SECTORS, schoolZone, toCompanies } from "../src/lib/schoolStage/companies";

// La clé est lue au moment de signer.
process.env.PAYMENT_LINK_SECRET = "test-secret";

const now = new Date("2026-11-18T12:00:00Z");
assert.equal(ageOn("2012-11-18", now), 14);
assert.equal(ageOn("2011-11-18", now), 15);
assert.equal(ageOn("2011-11-19", now), 14);
assert.equal(ageOn("pas une date", now), null);
assert.equal(waitsForParent({ birth_date: "2012-03-01" }, now), true);
assert.equal(waitsForParent({ birth_date: "2012-03-01", parent_consent_at: "2026-11-18T10:00:00Z" }, now), false);
assert.equal(waitsForParent({ birth_date: "2010-03-01" }, now), false);
assert.equal(waitsForParent({ birth_date: null }, now), true);
assert.equal(isSchoolStageLevel("3e"), true);
assert.equal(isSchoolStageLevel("cinquieme"), false);

const letter = schoolStageLetter({ level: "3e", fullName: "Léa Martin", school: "collège Jean Zay", dates: "8 au 12 décembre", company: "Boulangerie Dupont", activity: "Boulangerie-pâtisserie" });
assert.match(letter, /en classe de 3e à collège Jean Zay/);
assert.match(letter, /stage d'observation de 3e \(5 jours\), du 8 au 12 décembre/);
assert.match(letter, /au sein de Boulangerie Dupont/);
assert.match(letter, /Léa Martin$/);
assert.match(schoolStageLetter({ level: "bac_pro", fullName: null, company: "X", activity: null }), /PFMP/);

// Lien du parent : lié au compte ET à l'e-mail, et expire.
const uid = "0b6f2a1e-3c4d-4e5f-8a9b-0c1d2e3f4a5b";
const link = new URL(consentLink(uid, "Parent@Mail.fr", now.getTime())!);
const params = { u: link.searchParams.get("u"), e: link.searchParams.get("e"), s: link.searchParams.get("s") };
assert.equal(verifyConsentParams(params, "parent@mail.fr", now.getTime()), true);
assert.equal(verifyConsentParams(params, "autre@mail.fr", now.getTime()), false);
assert.equal(verifyConsentParams({ ...params, u: "1b6f2a1e-3c4d-4e5f-8a9b-0c1d2e3f4a5b" }, "parent@mail.fr", now.getTime()), false);
assert.equal(verifyConsentParams(params, "parent@mail.fr", now.getTime() + 31 * 86_400_000), false);
assert.equal(verifyConsentParams({ ...params, s: "x" }, "parent@mail.fr", now.getTime()), false);

// Annuaire : établissements fermés ou sans salarié écartés, enseigne préférée.
const fake = [
  {
    nom_complet: "SARL DUPONT",
    matching_etablissements: [
      { siret: "1", adresse: "1 RUE A 45000 ORLEANS", libelle_commune: "ORLEANS", activite_principale: "56.10A", caractere_employeur: "O", etat_administratif: "A", liste_enseignes: ["LE PETIT ZINC"] },
      { siret: "2", adresse: "2 RUE B 45000 ORLEANS", activite_principale: "56.10A", caractere_employeur: "N", etat_administratif: "A" },
      { siret: "3", adresse: "3 RUE C 45000 ORLEANS", activite_principale: "56.10A", etat_administratif: "F" },
      { siret: "4", adresse: "4 RUE D 45000 ORLEANS", activite_principale: "99.99Z", etat_administratif: "A" },
      { siret: "1", adresse: "1 RUE A 45000 ORLEANS", activite_principale: "56.10A", etat_administratif: "A" },
    ],
  },
];
const resto = SCHOOL_SECTORS.find((s) => s.id === "restauration")!;
const c = toCompanies(fake, resto.naf);
assert.equal(c.length, 1);
assert.deepEqual(c[0], { siret: "1", name: "Le Petit Zinc", activity: "Restaurant", address: "1 Rue A 45000 Orleans", city: "Orleans" });
assert.ok(schoolZone("Orléans"));
assert.equal(schoolZone(""), null);

// Réponse réelle de l'annuaire (facultatif).
if (process.argv[2]) {
  const real = toCompanies(JSON.parse(readFileSync(process.argv[2], "utf8")).results, resto.naf);
  assert.ok(real.length > 0, "aucune entreprise dans la réponse réelle");
  console.log(`annuaire réel : ${real.length} entreprises, ex. ${real[0].name} · ${real[0].address}`);
}
console.log("stages scolaires : OK");
