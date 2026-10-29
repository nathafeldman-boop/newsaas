// Test de prix du 29/10 : prix (+60 % après la bienvenue), offres ouvertes avant tenues à 7,99 €, statistiques de l'onglet Tests.
// Lancer : npx tsx --tsconfig tsconfig.json tests/price-test.test.ts
import assert from "node:assert/strict";
import {
  AUTO_MONTHLY_PRICE_IDS,
  AUTO_PRICES,
  AUTO_REGULAR_PRICE_IDS,
  FLASH_OFFER,
  isLegacyOffer,
  offerWindowStart,
  PLAN_PRICES,
  PREMIUM_PRICE_LINE,
  premiumMonthlyPriceIds,
  PRICE_TEST_START,
  priceSheet,
  REGULAR_PRICE_IDS,
  WELCOME_PRICE_IDS,
  WELCOME_WINDOW_MS,
} from "../src/lib/pricing/plans";
import { isAutoTier } from "../src/lib/subscription/isPremium";
import { centsPerDayCeiling } from "../src/lib/campaigns/serieVente";
import { armStats, MIN_BUYERS, probabilityTestBetter, purchasesIn, verdictFor } from "../src/lib/admin/priceTestStats";
import type { InvoiceRecord, StripeSnapshot, SubRecord } from "../src/lib/admin/cockpit/types";

const cents = (price: string) => Math.round(Number(price.replace(/[^\d,]/g, "").replace(",", ".")) * 100);

// Prix demandés : 9,99 € de bienvenue, puis au moins +60 % ; Auto 17,99 € / 80 € puis +60 %.
assert.equal(PLAN_PRICES.monthly.welcome, "9,99 €");
assert.equal(PLAN_PRICES.monthly.regular, "15,99 €");
assert.deepEqual(AUTO_PRICES, { monthly: { welcome: "17,99 €", regular: "28,79 €" }, lifetime: { welcome: "80 €", regular: "128 €" } });
for (const [w, r] of [
  [PLAN_PRICES.monthly.welcome, PLAN_PRICES.monthly.regular],
  [AUTO_PRICES.monthly.welcome, AUTO_PRICES.monthly.regular],
  [AUTO_PRICES.lifetime.welcome, AUTO_PRICES.lifetime.regular],
]) {
  assert.ok(cents(r) >= cents(w) * 1.6, `${r} doit faire au moins +60 % sur ${w}`);
}
assert.equal(PREMIUM_PRICE_LINE, "39,99 € à vie ou 9,99 €/mois");

// Identifiants Stripe : écrits en dur, reconnus partout (anciens compris).
for (const id of [WELCOME_PRICE_IDS.monthly, REGULAR_PRICE_IDS.monthly, AUTO_REGULAR_PRICE_IDS.monthly, AUTO_REGULAR_PRICE_IDS.lifetime]) assert.match(id, /^price_/);
assert.ok(premiumMonthlyPriceIds().includes(WELCOME_PRICE_IDS.monthly) && premiumMonthlyPriceIds().includes(REGULAR_PRICE_IDS.monthly));
assert.ok(premiumMonthlyPriceIds().includes("price_1USaRfRd6r34OMU6D3mrspqO"), "le 12,79 € reste reconnu (abonnements en cours)");
assert.ok(AUTO_MONTHLY_PRICE_IDS.includes(AUTO_REGULAR_PRICE_IDS.monthly));

// Offre ouverte avant le test : 7,99 € tenu jusqu'à sa fin ; ouverte après : 9,99 €.
const H = 3_600_000;
const flashBefore = PRICE_TEST_START - 2 * H + FLASH_OFFER.windowMs; // email reçu 2 h avant le test
assert.equal(offerWindowStart(0, flashBefore, PRICE_TEST_START + H), PRICE_TEST_START - 2 * H);
assert.equal(isLegacyOffer(offerWindowStart(0, flashBefore, PRICE_TEST_START + H)), true);
assert.equal(priceSheet(true).monthly.welcome, "7,99 €");
const flashAfter = PRICE_TEST_START + H + FLASH_OFFER.windowMs;
assert.equal(isLegacyOffer(offerWindowStart(0, flashAfter, PRICE_TEST_START + 2 * H)), false);
// Chrono de 10 min lancé 5 min avant le test : tenu ; lancé après : nouveau prix.
assert.equal(isLegacyOffer(offerWindowStart(PRICE_TEST_START + 5 * 60_000, null, PRICE_TEST_START + 60_000)), true);
assert.equal(isLegacyOffer(offerWindowStart(PRICE_TEST_START + WELCOME_WINDOW_MS + 60_000, null, PRICE_TEST_START + 2 * 60_000)), false);
// Plus d'offre en cours : prix normal, rien à tenir.
assert.equal(offerWindowStart(PRICE_TEST_START - H, null, PRICE_TEST_START + H), null);
assert.equal(isLegacyOffer(null), false);
// Minute de marge du paiement.
assert.notEqual(offerWindowStart(PRICE_TEST_START, null, PRICE_TEST_START + 30_000, 60_000), null);

// Email : « moins de N centimes par jour » toujours vrai.
assert.equal(centsPerDayCeiling("7,99 €"), 30);
assert.equal(centsPerDayCeiling("9,99 €"), 35);
assert.ok(999 / 30 < 35);

// Auto reconnue au nouveau prix mensuel (repli sans premium_tier).
assert.equal(isAutoTier({ subscription_status: "active", subscription_price_cents: 2879, subscription_interval: "month" }), true);
assert.equal(isAutoTier({ subscription_status: "active", subscription_price_cents: 1599, subscription_interval: "month" }), false);

// --- Onglet Tests ------------------------------------------------------------
const T0 = PRICE_TEST_START;
const sub = (id: string, customer: string, userId: string, priceIds: string[]): SubRecord => ({
  id, customer, userId, status: "active", priceIds, amountCents: 999, currency: "eur", interval: "month", intervalCount: 1, mrrCents: 999,
  created: T0, startDate: T0, anchor: T0, canceledAt: null, endedAt: null, cancelAt: null, cancelAtPeriodEnd: false, currentPeriodEnd: null,
  cancelReason: null, feedback: null, paused: false,
});
const inv = (id: string, subscription: string, customer: string, amountPaid: number, t: number): InvoiceRecord => ({
  id, customer, subscription, billingReason: "subscription_create", status: "paid", amountPaid, amountDue: amountPaid, currency: "eur", created: t, paidAt: t, attemptCount: 1,
});
const snap: StripeSnapshot = {
  computedAt: T0 + 10 * H,
  since: 0,
  subs: [sub("s1", "c1", "u1", [WELCOME_PRICE_IDS.monthly]), sub("s2", "c2", "u2", [AUTO_REGULAR_PRICE_IDS.monthly]), sub("s3", "c3", "u3", ["price_old"])],
  invoices: [inv("i1", "s1", "c1", 999, T0 + H), inv("i2", "s2", "c2", 2879, T0 + 2 * H), inv("i3", "s3", "c3", 799, T0 - 5 * H)],
  // u3 (déjà abonné avant) prend l'Auto à vie pendant le test : montée en gamme, pas un nouveau payant.
  oneTime: [
    { id: "o1", customer: "c3", userId: "u3", amountCents: 12800, currency: "eur", created: T0 + 3 * H, invoice: null },
    { id: "o2", customer: "c4", userId: "u4", amountCents: 3999, currency: "eur", created: T0 + 4 * H, invoice: null },
  ],
  refunds: [],
  disputes: [],
  otherCurrencySubs: 0,
};
const during = purchasesIn(snap, { start: T0, end: T0 + 48 * H });
assert.deepEqual(
  during.map((p) => [p.userId, p.plan, p.cents, p.first]),
  [
    ["u1", "premium_monthly", 999, true],
    ["u2", "auto_monthly", 2879, true],
    ["u3", "auto_lifetime", 12800, false],
    ["u4", "premium_lifetime", 3999, true],
  ],
);
const viewers = ["u1", "u2", "u4", "u5", "u6"];
const all = armStats({ viewers, checkouts: ["u1", "u2"], purchases: during });
assert.equal(all.viewers, 5);
assert.equal(all.buyers, 3);
assert.equal(all.revenueCents, 999 + 2879 + 3999);
assert.equal(all.rpvCents, (999 + 2879 + 3999) / 5);
assert.deepEqual(all.upgrades, { count: 1, cents: 12800 });
assert.deepEqual(all.byPlan.auto_monthly, { count: 1, cents: 2879 });
// Hors offre 48 h : u2 mis de côté (vu, payé).
const paywallOnly = armStats({ viewers, checkouts: [], purchases: during }, (u) => u !== null && u !== "u2");
assert.equal(paywallOnly.viewers, 4);
assert.equal(paywallOnly.buyers, 2);

// Probabilité : reproductible, et nette quand l'écart est grand.
const arm = (viewers: number, amounts: number[]) => ({ viewers, buyers: amounts.length, amounts });
const clearlyBetter = probabilityTestBetter(arm(400, Array(8).fill(799)), arm(400, Array(16).fill(999)));
assert.ok(clearlyBetter !== null && clearlyBetter > 0.9, `attendu > 0,9, obtenu ${clearlyBetter}`);
const clearlyWorse = probabilityTestBetter(arm(400, Array(20).fill(799)), arm(400, Array(4).fill(999)));
assert.ok(clearlyWorse !== null && clearlyWorse < 0.1, `attendu < 0,1, obtenu ${clearlyWorse}`);
assert.equal(probabilityTestBetter(arm(400, Array(8).fill(799)), arm(400, Array(16).fill(999))), clearlyBetter);
assert.equal(probabilityTestBetter(arm(0, []), arm(10, [999])), null);
assert.equal(probabilityTestBetter(arm(10, []), arm(10, [])), null);

// Verdict : rien tant qu'il n'y a pas assez de monde, puis seuils 10 % / 90 %.
const stats = (viewers: number, amounts: number[]) =>
  armStats({ viewers: Array.from({ length: viewers }, (_, i) => `v${i}`), checkouts: [], purchases: amounts.map((c, i) => ({ userId: `v${i}`, customer: `c${i}`, t: T0, cents: c, plan: "premium_monthly" as const, first: true })) });
assert.equal(verdictFor(stats(30, [799]), stats(30, [999]), 0.95, false).tone, "wait");
assert.equal(verdictFor(stats(200, Array(MIN_BUYERS).fill(799)), stats(200, Array(MIN_BUYERS).fill(999)), 0.95, true).tone, "good");
assert.equal(verdictFor(stats(200, Array(MIN_BUYERS).fill(799)), stats(200, Array(2).fill(999)), 0.05, true).tone, "bad");
const mid = verdictFor(stats(200, Array(MIN_BUYERS).fill(799)), stats(200, Array(MIN_BUYERS).fill(999)), 0.6, false);
assert.equal(mid.tone, "neutral");
assert.match(mid.title, /^Tendance pour l'instant/);
assert.match(verdictFor(stats(200, Array(MIN_BUYERS).fill(799)), stats(200, Array(MIN_BUYERS).fill(999)), 0.95, true).detail, /\+25 %/);

console.log("price-test: ok");
