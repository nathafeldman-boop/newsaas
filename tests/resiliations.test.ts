// Commentaires de résiliation (30/10) : « pas assez d'offres dans les Vosges ».
// Lancer : npx tsx --tsconfig tsconfig.json tests/resiliations.test.ts
import assert from "node:assert/strict";
import { regionDepartementLabels, regionName, sameRegionElsewhere } from "../src/lib/matching/region";
import { locationsFilter } from "../src/lib/offers/fetchActiveOffers";

// Vosges (88) → les 9 autres départements du Grand Est, pas les Vosges elles-mêmes.
const grandEst = regionDepartementLabels("88");
assert.equal(grandEst.length, 9);
assert.ok(grandEst.includes("54 -"));
assert.ok(grandEst.includes("67 -"));
assert.ok(!grandEst.includes("88 -"));
assert.ok(!grandEst.includes("75 -"));
// Le filtre PostgREST garde le tiret : « 54 - NANCY », pas une commune qui contient 54.
assert.ok(locationsFilter(grandEst)?.includes("location.ilike.%54 -%"));

// Sans département, ou outre-mer (pas de région à élargir) : rien.
assert.deepEqual(regionDepartementLabels(null), []);
assert.deepEqual(regionDepartementLabels("971"), []);

assert.equal(regionName("88"), "Grand Est");
assert.equal(regionName("971"), null);

// Offre ailleurs dans la région → nom de la région ; même département ou autre région → null.
assert.equal(sameRegionElsewhere("88", "54 - NANCY"), "Grand Est");
assert.equal(sameRegionElsewhere("88", "88 - EPINAL"), null);
assert.equal(sameRegionElsewhere("88", "75 - PARIS 11"), null);
assert.equal(sameRegionElsewhere(null, "54 - NANCY"), null);
assert.equal(sameRegionElsewhere("88", "Télétravail"), null);

console.log("resiliations.test.ts OK");
