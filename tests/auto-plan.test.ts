// Formule Stageio Auto : droits, quota quotidien (minuit de Paris),
// expéditeur des candidatures.
// Lancer : npx tsx --tsconfig tsconfig.json tests/auto-plan.test.ts
import assert from "node:assert/strict";
import { isAutoTier, isPremium } from "../src/lib/subscription/isPremium";
import { parisMidnightIso } from "../src/lib/applications/autoSend";
import { studentSender } from "../src/lib/inbox/sender";
import { AUTO_DAILY_LIMIT, AUTO_MONTHLY_CENTS, AUTO_PRICE_IDS } from "../src/lib/pricing/plans";

const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
const past = new Date(Date.now() - 10 * 86_400_000).toISOString();

assert.equal(AUTO_DAILY_LIMIT, 100);
assert.equal(AUTO_MONTHLY_CENTS, 1799);
assert.match(AUTO_PRICE_IDS.monthly, /^price_/);
assert.match(AUTO_PRICE_IDS.lifetime, /^price_/);

// Abonnement Auto sain : oui ; échu : non (même avec le tier encore posé).
assert.equal(isAutoTier({ subscription_status: "active", current_period_end: future, premium_tier: "auto" }), true);
assert.equal(isAutoTier({ subscription_status: "active", current_period_end: past, premium_tier: "auto" }), false);
assert.equal(isAutoTier({ subscription_status: "canceled", current_period_end: future, premium_tier: "auto" }), false);
// Accès à vie Auto, et accès à vie Premium + abonnement Auto.
assert.equal(isAutoTier({ subscription_status: "lifetime", premium_tier: "auto_lifetime" }), true);
assert.equal(isAutoTier({ subscription_status: "lifetime", premium_tier: "auto" }), true);
// Premium classique : non.
assert.equal(isAutoTier({ subscription_status: "active", current_period_end: future, premium_tier: null, subscription_price_cents: 1279, subscription_interval: "month" }), false);
assert.equal(isAutoTier({ subscription_status: "lifetime", premium_tier: null }), false);
// Avant le SQL (pas de premium_tier) : un mensuel à 17,99 € suffit.
assert.equal(isAutoTier({ subscription_status: "active", current_period_end: future, subscription_price_cents: 1799, subscription_interval: "month" }), true);
assert.equal(isAutoTier(null), false);
assert.equal(isPremium({ subscription_status: "lifetime" }), true);

// Minuit de Paris : heure d'hiver (UTC+1) et d'été (UTC+2), y compris juste après minuit.
assert.equal(parisMidnightIso(Date.parse("2026-10-26T10:00:00Z")), "2026-10-25T23:00:00.000Z");
assert.equal(parisMidnightIso(Date.parse("2026-10-25T23:30:00Z")), "2026-10-25T23:00:00.000Z");
assert.equal(parisMidnightIso(Date.parse("2026-07-01T21:30:00Z")), "2026-06-30T22:00:00.000Z");
assert.equal(parisMidnightIso(Date.parse("2026-07-01T22:30:00Z")), "2026-07-01T22:00:00.000Z");

// Expéditeur : l'adresse de l'étudiant, nom nettoyé.
assert.deepEqual(studentSender('Léa "M" <x>', "lea.m.ab12@candidat.stageio.fr"), {
  from: "Léa M x <lea.m.ab12@candidat.stageio.fr>",
  replyTo: "lea.m.ab12@candidat.stageio.fr",
});
assert.equal(studentSender(null, "a@candidat.stageio.fr").from, "Candidature <a@candidat.stageio.fr>");

console.log("auto-plan: OK");
