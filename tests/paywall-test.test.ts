// Test A/B du paywall (8/11) : moitié/moitié, tirage fixe par compte, titre
// selon le contrat cherché.
// Lancer : npx tsx --tsconfig tsconfig.json tests/paywall-test.test.ts
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { paywallHeadline, paywallVariant } from "../src/lib/premium/paywallTest";

const ids = Array.from({ length: 4000 }, () => randomUUID());
const share = ids.filter((id) => paywallVariant(id) === "a_vie").length / ids.length;
assert.ok(share > 0.46 && share < 0.54, `répartition ${share}`);
assert.ok(ids.every((id) => paywallVariant(id) === paywallVariant(id)));

assert.equal(paywallHeadline(["cdi"]), "Trouve ton CDI plus efficacement.");
assert.equal(paywallHeadline(["alternance"]), "Trouve ton alternance plus efficacement.");
assert.equal(paywallHeadline([]), "Trouve ton alternance ou ton stage plus efficacement.");
console.log("paywall-test : OK");
