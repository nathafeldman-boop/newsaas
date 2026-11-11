// Upsell « candidatures en plus » (11/11) : grille de prix, levée de pause, reconnaissance des sessions Stripe.
// Lancer : npx tsx --tsconfig tsconfig.json tests/credit-packs.test.ts
import assert from "node:assert/strict";
import { CREDIT_PACKS, findCreditPack, isPaceFree, paceFreeUntil, euros, PACE_UNLOCK } from "@/lib/pricing/creditPacks";
import { upsellKind } from "@/lib/stripe/applyUpsell";

assert.deepEqual(
  CREDIT_PACKS.map((p) => [p.credits, p.cents]),
  [[25, 400], [50, 500], [100, 700], [250, 1000], [500, 1500], [1500, 2000], [10000, 4000]],
);
assert.equal(PACE_UNLOCK.cents, 200);

assert.equal(findCreditPack("c250")?.credits, 250);
assert.equal(findCreditPack("c999"), null);
assert.equal(findCreditPack(undefined), null);

assert.equal(euros(400), "4 €");
assert.equal(euros(4000), "40 €");
assert.equal(euros(250), "2,50 €");

const now = Date.parse("2026-11-11T10:00:00Z");
assert.equal(paceFreeUntil(null, now), "2026-11-12T10:00:00.000Z");
assert.equal(paceFreeUntil("2026-11-11T20:00:00Z", now), "2026-11-12T20:00:00.000Z");
assert.equal(paceFreeUntil("2026-11-10T20:00:00Z", now), "2026-11-12T10:00:00.000Z");
assert.equal(isPaceFree("2026-11-12T10:00:00Z", now), true);
assert.equal(isPaceFree("2026-11-11T09:00:00Z", now), false);
assert.equal(isPaceFree(null, now), false);

assert.equal(upsellKind({ mode: "payment", metadata: { kind: "auto_credits" } }), "auto_credits");
assert.equal(upsellKind({ mode: "payment", metadata: { kind: "pace_unlock" } }), "pace_unlock");
assert.equal(upsellKind({ mode: "payment", metadata: { tier: "auto" } }), null);
assert.equal(upsellKind({ mode: "subscription", metadata: { kind: "auto_credits" } }), null);

console.log("credit-packs : OK");
