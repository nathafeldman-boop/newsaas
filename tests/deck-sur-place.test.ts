// Abonné « Sur place uniquement » (4/11) : un abonné de Metz notait 1/5 « Les lieux sont beaucoup trop
// lointains » ; avec moins de 10 offres proches, son paquet se remplissait de toute la France.
// Lancer : npx tsx --tsconfig tsconfig.json tests/deck-sur-place.test.ts
import assert from "node:assert/strict";
import { deckUsesNearOnly } from "../src/lib/matching/deck";

const MIN = 10;
// Sur place uniquement : toujours la zone, même avec 0, 2 ou 5 offres proches.
for (const near of [0, 2, 5, 9, 10, 40]) assert.equal(deckUsesNearOnly(true, "Sur place uniquement", near, MIN), true, `sur place, ${near} offres proches`);
// Autre mobilité : comme avant (zone seulement s'il y a assez d'offres proches, sinon le paquet élargi).
assert.equal(deckUsesNearOnly(true, "Mobile dans la région", 9, MIN), false);
assert.equal(deckUsesNearOnly(true, "Mobile dans la région", 10, MIN), true);
assert.equal(deckUsesNearOnly(true, "Mobile en France", 3, MIN), false);
assert.equal(deckUsesNearOnly(true, null, 3, MIN), false);
assert.equal(deckUsesNearOnly(true, "", 25, MIN), true);
// Le deck d'avant le paiement ne change jamais.
for (const near of [0, 9, 10, 40]) assert.equal(deckUsesNearOnly(false, "Sur place uniquement", near, MIN), false, `gratuit, ${near}`);

console.log("deck-sur-place : OK");
