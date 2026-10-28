// Objectifs et simulateur (26/10) : avancement du mois, plan, simulation, canaux, renouvellements attendus.
// Lancer : npx tsx --tsconfig tsconfig.json tests/goals.test.ts
import assert from "node:assert/strict";
import { byChannel, expectedRenewals, goalFor, monthLabel, monthProgress, planFor, shiftMonth, simulate } from "../src/lib/admin/goals";
import type { InvoiceRecord, StripeSnapshot, SubRecord } from "../src/lib/admin/cockpit/types";
import { forecastFor, totalRevenue } from "../src/lib/admin/history";

const D = 86_400_000;

// Objectifs : ceux fixés le 26/10, remplacés par ceux enregistrés.
assert.equal(goalFor("2026-10", {}), 130_000);
assert.equal(goalFor("2026-11", {}), 300_000);
assert.equal(goalFor("2026-12", {}), 500_000);
assert.equal(goalFor("2026-12", { "2026-12": 450_000 }), 450_000);
assert.equal(goalFor("2027-01", {}), null);
assert.equal(shiftMonth("2026-12", 1), "2027-01");
assert.equal(shiftMonth("2026-10", -1), "2026-09");
assert.equal(monthLabel("2026-11"), "novembre 2026");

// Mois de 10 jours, 4 commencés (le 4e en cours), objectif 1 000 €.
{
  const start = Date.UTC(2026, 9, 1);
  const days = Array.from({ length: 10 }, (_, i) => ({ t: start + i * D, cents: [10_000, 20_000, 30_000, 5_000][i] ?? 0 }));
  const now = start + 3 * D + 3_600_000;
  const p = monthProgress(days, 100_000, now, true);
  assert.equal(p.totalCents, 65_000);
  assert.deepEqual(p.cumulative, [10_000, 30_000, 60_000, 65_000]);
  assert.deepEqual(p.pace, [10_000, 20_000, 30_000, 40_000]);
  assert.equal(p.daysElapsed, 4);
  assert.equal(p.daysToGo, 7, "aujourd'hui (pas fini) + 6 jours");
  assert.equal(p.avgLast7, 20_000, "moyenne des 3 jours terminés");
  // 60 000 terminés + max(5 000, 20 000) aujourd'hui + 6 × 20 000
  assert.equal(p.projectionCents, 200_000);
  assert.equal(p.neededPerDay, Math.ceil(35_000 / 7));
  assert.equal(p.best?.cents, 30_000);
  assert.equal(p.expectedRatio, 0.4);

  // Mois terminé : aucun jour en cours, rien à faire de plus.
  const past = monthProgress(days, 50_000, start + 20 * D, false);
  assert.equal(past.totalCents, 65_000);
  assert.equal(past.daysToGo, 0);
  assert.equal(past.neededPerDay, 0);

  // Mois à venir : rien d'encaissé, tout à faire.
  const future = monthProgress(days, 100_000, start - D, false);
  assert.equal(future.totalCents, 0);
  assert.equal(future.daysToGo, 10);
  assert.equal(future.neededPerDay, 10_000);
}

// Plan : 3 000 € dont 500 € de renouvellements, 2 % de conversion, 20 € de premier paiement.
{
  const plan = planFor(300_000, 50_000, { conversion: 0.02, avgFirstPaymentCents: 2_000, paywallRate: 0.6, checkoutRate: 0.1, signupsPer1000Views: 2 });
  assert.equal(plan.newRevenueCents, 250_000);
  assert.equal(plan.payers, 125);
  assert.equal(plan.signups, 6_250);
  assert.equal(plan.paywallViews, 3_750);
  assert.equal(plan.checkouts, 625);
  assert.equal(plan.views, 3_125_000);
  // Sans taux mesuré : rien d'inventé.
  const empty = planFor(300_000, 0, { conversion: null, avgFirstPaymentCents: 2_000, paywallRate: null, checkoutRate: null, signupsPer1000Views: null });
  assert.equal(empty.payers, 150);
  assert.equal(empty.signups, null);
  assert.equal(empty.views, null);
  // Déjà couvert par les renouvellements.
  assert.equal(planFor(10_000, 20_000, { conversion: 0.02, avgFirstPaymentCents: 2_000, paywallRate: null, checkoutRate: null, signupsPer1000Views: null }).payers, 0);
}

// Simulation : 6 000 inscrits, 2 %, 20 € de premier paiement, moitié en mensuel à 10 €, 80 % restent.
{
  const s = simulate({ signups: 6_000, conversion: 0.02, avgFirstPaymentCents: 2_000, monthlyShare: 0.5, monthlyPriceCents: 1_000, retention: 0.8, months: 3 });
  assert.equal(s.payers, 120);
  assert.equal(s.monthlyPayers, 60);
  assert.deepEqual(s.byMonth, [240_000, 48_000, 38_400]);
  assert.equal(s.totalCents, 326_400);
}

// Canaux : « TikTok · commentaire » et « TikTok · vidéo » regroupés.
{
  const rows = byChannel([
    { source: "TikTok · commentaire", answers: 50, payers: 2, cents: 3_000 },
    { source: "TikTok · vidéo", answers: 30, payers: 1, cents: 800 },
    { source: "Google", answers: 10, payers: 0, cents: 0 },
  ]);
  assert.deepEqual(rows[0], { channel: "TikTok", signups: 80, payers: 3, cents: 3_800 });
  assert.equal(rows[1].channel, "Google");
}

// Renouvellements attendus : un abonné mensuel à 10 € (ancre au 1er), un résilié en fin de période.
{
  const NOW = Date.UTC(2026, 9, 26, 12);
  const sub = (o: Partial<SubRecord> & { id: string }): SubRecord => ({
    customer: "cus_" + o.id, userId: "u_" + o.id, status: "active", priceIds: ["p"], amountCents: 1_000, currency: "eur",
    interval: "month", intervalCount: 1, mrrCents: 1_000, created: Date.UTC(2026, 8, 1), startDate: Date.UTC(2026, 8, 1), anchor: Date.UTC(2026, 8, 1),
    canceledAt: null, endedAt: null, cancelAt: null, cancelAtPeriodEnd: false, currentPeriodEnd: Date.UTC(2026, 10, 1), cancelReason: null, feedback: null, paused: false, ...o,
  });
  const inv = (s: SubRecord, at: number, reason: string, status = "paid"): InvoiceRecord => ({
    id: `in_${s.id}_${at}`, customer: s.customer, subscription: s.id, billingReason: reason, status, amountPaid: status === "paid" ? 1_000 : 0, amountDue: 1_000,
    currency: "eur", created: at, paidAt: status === "paid" ? at : null, attemptCount: 1,
  });
  const keep = sub({ id: "keep" });
  const leaving = sub({ id: "leaving", cancelAtPeriodEnd: true });
  const snap: StripeSnapshot = {
    computedAt: NOW, since: 0, otherCurrencySubs: 0, refunds: [], disputes: [], oneTime: [],
    subs: [keep, leaving],
    invoices: [
      inv(keep, Date.UTC(2026, 8, 1), "subscription_create"),
      inv(keep, Date.UTC(2026, 9, 1), "subscription_cycle"),
      inv(leaving, Date.UTC(2026, 8, 1), "subscription_create"),
      inv(leaving, Date.UTC(2026, 9, 1), "subscription_cycle"),
    ],
  };
  // Novembre : seule l'échéance du 1/11 de « keep » (résilié exclu), taux mesuré 100 % (2 réussis sur 2).
  const nov = expectedRenewals(snap, { start: Date.UTC(2026, 10, 1) - 3_600_000, end: Date.UTC(2026, 11, 1) - 3_600_000 }, NOW);
  assert.equal(nov.cents, 1_000);
  assert.equal(nov.firstRate, 1);
  // Décembre : l'échéance du 1/12, après celle du 1/11.
  const dec = expectedRenewals(snap, { start: Date.UTC(2026, 11, 1) - 3_600_000, end: Date.UTC(2027, 0, 1) - 3_600_000 }, NOW);
  assert.equal(dec.cents, 1_000);
}

// Historique (28/10) : prévision du mois en cours et des mois à venir ; revenu total net.
{
  // Mois de 30 jours, 10 jours écoulés : 300 inscrits et 6 payants à date → ×3 en fin de mois.
  const cur = forecastFor({ kind: "current", days: 30, elapsedDays: 10, actual: { revenueCents: 50_000, signups: 300, newPayers: 6 }, projectionCents: 140_000, renewalCents: 0, rates: null });
  assert.deepEqual(cur, { revenueCents: 140_000, signups: 900, newPayers: 18 });
  // Projection plus basse que le déjà encaissé : jamais en dessous du réel.
  assert.equal(forecastFor({ kind: "current", days: 30, elapsedDays: 29, actual: { revenueCents: 90_000, signups: 1, newPayers: 1 }, projectionCents: 80_000, renewalCents: 0, rates: null })?.revenueCents, 90_000);
  // Mois à venir : renouvellements attendus + 1ers paiements au rythme mesuré.
  const next = forecastFor({ kind: "forecast", days: 30, elapsedDays: 0, actual: { revenueCents: 0, signups: 0, newPayers: 0 }, projectionCents: null, renewalCents: 20_000, rates: { firstPaymentCents: 3_000, firstPayments: 0.4, signups: 40 } });
  assert.deepEqual(next, { revenueCents: 110_000, signups: 1_200, newPayers: 12 });
  // Sans taux mesurés : seulement les renouvellements, rien d'inventé.
  assert.deepEqual(forecastFor({ kind: "forecast", days: 30, elapsedDays: 0, actual: { revenueCents: 0, signups: 0, newPayers: 0 }, projectionCents: null, renewalCents: 20_000, rates: null }), { revenueCents: 20_000, signups: null, newPayers: null });

  const snap: StripeSnapshot = {
    computedAt: 0, since: 0, otherCurrencySubs: 0, subs: [], disputes: [],
    oneTime: [{ id: "cs", customer: "c", userId: "u", amountCents: 3_000, currency: "eur", created: Date.UTC(2026, 9, 2), invoice: null }],
    invoices: [{ id: "i1", customer: "c2", subscription: "s1", billingReason: "subscription_create", status: "paid", amountPaid: 799, amountDue: 799, currency: "eur", created: Date.UTC(2026, 8, 5), paidAt: Date.UTC(2026, 8, 5), attemptCount: 1 }],
    refunds: [{ id: "r", customer: "c2", amount: 799, created: Date.UTC(2026, 9, 3) }],
  };
  assert.deepEqual(totalRevenue(snap, Date.UTC(2026, 9, 28)), { netCents: 3_000, grossCents: 3_799, refundedCents: 799 });
}

console.log("goals: ok");
