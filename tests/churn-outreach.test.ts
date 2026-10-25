// Messages aux abonnés qui partent (25/10) : qui les reçoit, et ce qu'ils disent.
// Lancer : npx tsx --tsconfig tsconfig.json tests/churn-outreach.test.ts
import assert from "node:assert/strict";
import { scheduledCandidates, winbackCandidates } from "../src/lib/churn/candidates";
import { buildChurnMessage, churnSurveyUrl } from "../src/lib/resend/churnMessage";
import type { InvoiceRecord, StripeSnapshot, SubRecord } from "../src/lib/admin/cockpit/types";

const D = 86_400_000;
const NOW = Date.UTC(2026, 9, 25, 12);
const sub = (o: Partial<SubRecord> & { id: string }): SubRecord => ({
  customer: "cus_" + o.id, userId: "u_" + o.id, status: "active", priceIds: ["p"], amountCents: 799, currency: "eur",
  interval: "month", intervalCount: 1, mrrCents: 799, created: NOW - 40 * D, startDate: NOW - 40 * D, anchor: NOW - 40 * D, canceledAt: null, endedAt: null,
  cancelAt: null, cancelAtPeriodEnd: false, currentPeriodEnd: NOW + 10 * D, cancelReason: null, feedback: null, paused: false, ...o,
});
const paidInv = (s: SubRecord): InvoiceRecord => ({
  id: "in_" + s.id, customer: s.customer, subscription: s.id, billingReason: "subscription_create", status: "paid", amountPaid: 799, amountDue: 799,
  currency: "eur", created: s.startDate, paidAt: s.startDate, attemptCount: 1,
});
const subs = [
  sub({ id: "keep" }), // en cours, rien de programmé
  sub({ id: "sched", cancelAtPeriodEnd: true }), // résiliation programmée
  sub({ id: "gone", status: "canceled", endedAt: NOW - 5 * D, canceledAt: NOW - 5 * D }), // parti il y a 5 jours
  sub({ id: "old", status: "canceled", endedAt: NOW - 90 * D, canceledAt: NOW - 90 * D, startDate: NOW - 120 * D }), // parti il y a 3 mois
  sub({ id: "back1", userId: "u_back", status: "canceled", endedAt: NOW - 10 * D }), // parti puis revenu…
  sub({ id: "back2", userId: "u_back", startDate: NOW - 3 * D, created: NOW - 3 * D }), // …avec un nouvel abonnement
  sub({ id: "life", userId: "u_life", status: "canceled", endedAt: NOW - 7 * D }), // parti, mais a pris l'accès à vie
  sub({ id: "never", status: "incomplete_expired", endedAt: NOW - 2 * D }), // n'a jamais payé
];
const snap: StripeSnapshot = {
  computedAt: NOW, since: 0, otherCurrencySubs: 0, refunds: [], disputes: [],
  subs,
  invoices: subs.filter((s) => s.id !== "never").map(paidInv),
  oneTime: [{ id: "cs", customer: "cus_life", userId: "u_life", amountCents: 3999, currency: "eur", created: NOW - 6 * D, invoice: null }],
};

assert.deepEqual(scheduledCandidates(snap, NOW).map((s) => s.id), ["sched"]);
assert.deepEqual(winbackCandidates(snap, NOW).map((c) => c.subscriptionId), ["gone"]);

// Le message : vrai questionnaire, compromis, aucune remise inventée, « ce qui arrive » masqué tant que vide.
const programme = buildChurnMessage({ kind: "programme", profileId: "p1", fullName: "Léa Martin", dateLabel: "jeudi 12 novembre", price: "7,99 €/mois" });
assert.match(programme.subject, /12 novembre/);
assert.ok(programme.html.includes("Salut Léa,"));
assert.ok(programme.html.includes(churnSurveyUrl("p1", "programme")));
assert.ok(programme.html.includes("/premium/garder"));
assert.ok(programme.html.includes("7,99 €/mois"));
assert.ok(!/%|remise|réduction|offert/i.test(programme.html.replace(/style="[^"]*"/g, "")));
assert.ok(!programme.html.includes("Ce qui arrive"));
const parti = buildChurnMessage({ kind: "parti", profileId: "p2", fullName: null, dateLabel: "lundi 20 octobre" });
assert.equal(parti.subject, "Ton alternance, tu en es où ?");
assert.ok(parti.html.includes("Salut,"));
assert.ok(parti.html.includes(churnSurveyUrl("p2", "parti", "trouve")));
assert.ok(parti.html.includes("/api/unsubscribe?u=p2"));

console.log("churn-outreach : OK");
