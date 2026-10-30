// Lettres Stageio Auto (30/10) : plus de « Vendeur en alternance (H/F) en alternance chez … ».
// Lancer : npx tsx --tsconfig tsconfig.json tests/lettre-intitule.test.ts
import assert from "node:assert/strict";
import { letterJobTitle } from "../src/lib/coverLetter/jobTitle";
import { generateStaticCoverLetter } from "../src/lib/coverLetter/staticGenerator";

const cases: [string, string, string][] = [
  ["Vendeur en alternance (H/F)", "alternance", "Vendeur"],
  ["Conseiller de vente en alternance", "alternance", "Conseiller de vente"],
  ["Vendeuse alternance", "alternance", "Vendeuse"],
  ["Alternance - Chargé(e) de missions RH H/F", "alternance", "Chargé(e) de missions RH"],
  ["Assistant commercial F/H - contrat d'apprentissage", "alternance", "Assistant commercial"],
  ["Apprenti boulanger (H/F)", "alternance", "Apprenti boulanger"],
  ["Alternance", "alternance", "Alternance"],
  ["Stage ingénieur DevOps (H/F)", "stage", "ingénieur DevOps"],
  ["Data analyst - Stage", "stage", "Data analyst"],
  ["Stage de fin d'études - Data analyst", "stage", "Stage de fin d'études - Data analyst"],
  ["Comptable (stage)", "stage", "Comptable"],
];
for (const [title, contract, expected] of cases) assert.equal(letterJobTitle(title, contract), expected, title);

const base = { company: "Boulangerie Martin", description: "Vente, conseil, encaissement.", requirements: null, contract_type: "alternance", sector: "Commerce" };
const profile = { full_name: "Léa Martin", sectors: ["Commerce"], target_jobs: ["Vendeur"], skills: [], education_level: "Bac+2", formation: null } as never;
for (const title of ["Vendeur en alternance (H/F)", "Conseiller de vente en alternance", "Vendeuse alternance"]) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const letter = generateStaticCoverLetter({ ...base, title } as never, profile, undefined, attempt);
    assert.doesNotMatch(letter, /alternance\)?\s+(?:en\s+)?alternance/i, letter);
    assert.doesNotMatch(letter, /\(H\/F\)|H\/F/, letter);
  }
}
console.log("lettre-intitule.test.ts OK");
