// Calculs du cockpit admin sur des données Stripe fictives.
// Lancer : npx tsx --tsconfig tsconfig.json tests/cockpit-metrics.test.ts
import assert from "node:assert/strict";
import * as m from "../src/lib/admin/cockpit/metrics";
import type { StripeSnapshot, SubRecord, InvoiceRecord } from "../src/lib/admin/cockpit/types";
const D = m.DAY_MS;
const T0 = Date.UTC(2026, 8, 1); // 1er sept
const sub = (o: Partial<SubRecord> & { id: string }): SubRecord => ({
  customer: "cus_" + o.id, userId: "u_" + o.id, status: "active", priceIds: ["p"], amountCents: 799, currency: "eur",
  interval: "month", intervalCount: 1, mrrCents: 799, created: T0, startDate: T0, anchor: T0, canceledAt: null, endedAt: null,
  cancelAt: null, cancelAtPeriodEnd: false, currentPeriodEnd: null, cancelReason: null, feedback: null, paused: false, ...o,
});
const inv = (o: Partial<InvoiceRecord> & { id: string; subscription: string }): InvoiceRecord => ({
  customer: "cus_" + o.subscription, billingReason: "subscription_create", status: "paid", amountPaid: 799, amountDue: 799,
  currency: "eur", created: T0, paidAt: T0, attemptCount: 1, ...o,
});
// A : mensuel depuis 1/9, renouvelé le 1/10 (payé)
// B : mensuel depuis 1/9, annulé (immédiat) le 1/10 + 2h après renouvellement payé
// C : mensuel depuis 10/9, résiliation programmée pour 10/10 (ended 10/10)
// D : hebdo 3,50 depuis 1/9, renouvellement 8/9 échoué, terminé 20/9 (payment_failed)
// E : jamais payé (incomplete)
const oct1 = Date.UTC(2026, 9, 1), sep10 = Date.UTC(2026, 8, 10), oct10 = Date.UTC(2026, 9, 10);
const snap: StripeSnapshot = {
  computedAt: 0, since: 0, otherCurrencySubs: 0, refunds: [{ id: "r1", customer: "cus_B", amount: 799, created: oct1 + 3 * 3600_000 }], disputes: [],
  oneTime: [{ id: "cs1", customer: "cus_L", userId: "u_L", amountCents: 3999, currency: "eur", created: T0 + 5 * D, invoice: "in_L" }],
  subs: [
    sub({ id: "A" }),
    sub({ id: "B", endedAt: oct1 + 2 * 3600_000, canceledAt: oct1 + 2 * 3600_000, status: "canceled", cancelReason: "cancellation_requested" }),
    sub({ id: "C", startDate: sep10, created: sep10, anchor: sep10, canceledAt: sep10 + 2 * D, cancelAt: oct10, endedAt: oct10, status: "canceled", cancelReason: "cancellation_requested", feedback: "too_expensive" }),
    sub({ id: "D", interval: "week", amountCents: 350, mrrCents: Math.round(m.DAY_MS * 0 + (350 * 52) / 12), endedAt: Date.UTC(2026, 8, 20), status: "canceled", cancelReason: "payment_failed" }),
    sub({ id: "E", status: "incomplete_expired", endedAt: T0 + D }),
  ],
  invoices: [
    inv({ id: "a1", subscription: "A" }), inv({ id: "a2", subscription: "A", billingReason: "subscription_cycle", created: oct1, paidAt: oct1 }),
    inv({ id: "b1", subscription: "B" }), inv({ id: "b2", subscription: "B", billingReason: "subscription_cycle", created: oct1, paidAt: oct1 }),
    inv({ id: "c1", subscription: "C", created: sep10, paidAt: sep10 }),
    inv({ id: "d1", subscription: "D", amountPaid: 350, amountDue: 350 }),
    inv({ id: "d2", subscription: "D", billingReason: "subscription_cycle", created: T0 + 7 * D, status: "open", paidAt: null, amountPaid: 0, attemptCount: 3 }),
    inv({ id: "e1", subscription: "E", status: "void", paidAt: null, amountPaid: 0 }),
    { id: "in_L", customer: "cus_L", subscription: null, billingReason: "manual", status: "paid", amountPaid: 3999, amountDue: 3999, currency: "eur", created: T0 + 5 * D, paidAt: T0 + 5 * D, attemptCount: 1 },
  ],
};
const fp = m.firstPaidBySub(snap.invoices);
const paid = m.paidSubs(snap, fp);
assert.deepEqual(paid.map((s) => s.id).sort(), ["A", "B", "C", "D"]);
assert.equal(m.dueDate({ anchor: Date.UTC(2026, 0, 31, 10), interval: "month", intervalCount: 1 }, 1), Date.UTC(2026, 1, 28, 10));
assert.equal(m.dueDate({ anchor: Date.UTC(2026, 0, 31, 10), interval: "month", intervalCount: 1 }, 2), Date.UTC(2026, 2, 31, 10));
// MRR au 15/9 : A, B, C (799 chacun) + D (350*52/12=1517)
assert.equal(m.mrrAt(paid, Date.UTC(2026, 8, 15)), 799 * 3 + 1517);
// Au 5/10 : A, C (programmé mais en cours)
const now = Date.UTC(2026, 9, 5);
const st = m.currentState(paid, now);
assert.equal(st.active, 2); assert.equal(st.scheduled.count, 1);
// C : status "canceled" mais endedAt futur -> compté actif ; cancelAt défini -> programmé
// Revenus septembre : A1 799 + B1 799 + C1 799 + D1 350 = 2747 récurrent ; à vie 3999 ; remboursement octobre
const sept = { start: T0, end: oct1 };
const rev = m.revenueIn(snap, sept);
assert.equal(rev.recurringCents, 2747); assert.equal(rev.oneTimeCents, 3999); assert.equal(rev.refundedCents, 0);
const octR = m.revenueIn(snap, { start: oct1, end: Date.UTC(2026, 10, 1) });
assert.equal(octR.recurringCents, 1598); assert.equal(octR.refundedCents, 799); assert.equal(octR.netCents, 799);
// Achat à vie d'un compte supprimé depuis (28/10) : sa facture sans session reliée compte, sans double compte de in_L.
{
  const orphan = { id: "in_X", customer: "cus_X", subscription: null, billingReason: "manual", status: "paid", amountPaid: 4000, amountDue: 4000, currency: "eur", created: oct1 + D, paidAt: oct1 + D, attemptCount: 1 };
  const withOrphan = { ...snap, invoices: [...snap.invoices, orphan] };
  assert.equal(m.revenueIn(withOrphan, { start: oct1, end: Date.UTC(2026, 10, 1) }).oneTimeCents, 4000);
  assert.equal(m.revenueIn(withOrphan, sept).oneTimeCents, 3999);
}
// Mouvements septembre : 4 nouveaux, 1 à vie, 0 renouvellement payé ; l'échec de D (terminé) est un client perdu, pas un paiement à récupérer
const mv = m.movementIn(snap, sept, fp);
assert.equal(mv.newSubs, 4); assert.equal(mv.lifetimeBuyers, 1); assert.equal(mv.renewals, 0); assert.equal(mv.failedOpen, 0); assert.equal(mv.lostAfterFailure, 1); assert.equal(mv.cancelRequests, 1);
// Churn octobre : au 1/10 en cours : A, B, C (D fini le 20/9) ; terminés en oct : B (1/10), C (10/10) -> 2/3
const ch = m.churnIn(paid, { start: oct1, end: Date.UTC(2026, 10, 1) });
assert.equal(ch.startCount, 3); assert.equal(ch.churned, 2); assert.equal(ch.voluntary, 2);
// Churn septembre : au 1/9 en cours : A, B, D (C commence le 10) -> D churn involontaire 1/3
const chS = m.churnIn(paid, sept);
assert.equal(chS.startCount, 3); assert.equal(chS.churned, 1); assert.equal(chS.involuntary, 1);
// Renouvellements d'octobre : A réussi (1/10), B réussi (1/10), C annulé avant (10/10), 
const ren = m.renewalsIn(snap, { start: oct1, end: Date.UTC(2026, 10, 1) }, now, fp);
const byId = Object.fromEntries(ren.map((x) => [x.sub.id + x.k, x.outcome]));
assert.equal(byId.A1, "réussi"); assert.equal(byId.B1, "réussi"); assert.equal(byId.C1, "annulé avant l'échéance");
// Septembre : D hebdo : 8/9 échoué, puis 15/9 -> inconnu? D fini le 20/9 -> 15/9 inconnu (pas de facture), 22/9 > fin -> stop
const summary = m.renewalSummary(ren);
assert.equal(summary.first.due, 3);
assert.equal(summary.first.ok, 2);
assert.equal(summary.first.paymentRate, 1);

// Renouvellements : après la fin d'un abonnement, plus aucune échéance inventée.
const renS2 = m.renewalsIn(snap, sept, now, fp).filter((x) => x.sub.id === "D");
assert.deepEqual(renS2.map((x) => x.outcome), ["échoué", "inconnu"]);
const cohorts = m.paidCohorts(snap, Date.UTC(2026, 11, 15), "month", fp);
assert.equal(cohorts[0].subs, 4);
assert.equal(cohorts[0].lifetime, 1);
assert.deepEqual(cohorts[0].firstRenewal, { ok: 2, failed: 1, canceled: 1, pending: 0 });
assert.equal(cohorts[0].alive[30].alive, 2);
// Paiement refusé sur un abonnement encore en cours (impayé) : à récupérer.
{
  const live: StripeSnapshot = {
    ...snap,
    subs: [sub({ id: "P", status: "past_due" })],
    invoices: [inv({ id: "p1", subscription: "P" }), inv({ id: "p2", subscription: "P", billingReason: "subscription_cycle", created: T0 + 10 * D, status: "open", paidAt: null, amountPaid: 0, attemptCount: 2 })],
  };
  const mvLive = m.movementIn(live, sept);
  assert.equal(mvLive.failedOpen, 1); assert.equal(mvLive.lostAfterFailure, 0);
}
console.log("cockpit-metrics : OK");
