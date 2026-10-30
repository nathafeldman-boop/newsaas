// Onglet Remboursements (30/10) : demandes repérées, délai, statut.
// Lancer : npx tsx --tsconfig tsconfig.json tests/remboursements.test.ts
import assert from "node:assert/strict";
import { buildRefundRequests, mentionsRefund, paymentsByCustomer, pendingPeople, stripeRefundComments } from "../src/lib/admin/refunds";
import type { StripeSnapshot, SubRecord } from "../src/lib/admin/cockpit/types";
import { followUpAt, renderFreeMonthEmail, renderRefundAckEmail } from "../src/lib/refunds/process";

const DAY = 86_400_000;
const T0 = Date.parse("2026-10-26T09:11:00Z");

assert.ok(mentionsRefund("Toutes les offres ne sont plus disponibles je souhaite un remboursement"));
assert.ok(mentionsRefund("Remboursez moi"));
assert.ok(mentionsRefund("je veux récupérer mon argent"));
assert.ok(!mentionsRefund("pas d'offre pour moi ."));
assert.ok(!mentionsRefund(null));

const sub = (id: string, customer: string, userId: string | null, comment: string | null, canceledAt: number | null): SubRecord => ({
  id, customer, userId, status: "active", priceIds: [], amountCents: 799, currency: "eur", interval: "month", intervalCount: 1, mrrCents: 799,
  created: T0, startDate: T0, anchor: T0, canceledAt, endedAt: null, cancelAt: null, cancelAtPeriodEnd: true, currentPeriodEnd: T0 + 30 * DAY,
  cancelReason: canceledAt ? "cancellation_requested" : null, feedback: "other", cancelComment: comment, paused: false,
});
const snap: StripeSnapshot = {
  computedAt: T0 + 5 * DAY,
  since: 0,
  subs: [
    sub("sub_a", "cus_a", "user-a", "Toutes les offres ne sont plus disponibles je souhaite un remboursement", T0 + 40 * 60_000),
    sub("sub_b", "cus_b", "user-b", "pas d'offre pour moi .", T0),
    sub("sub_c", "cus_c", "user-c", "remboursez-moi svp", T0 + 20 * DAY),
  ],
  invoices: [
    { id: "in_a", customer: "cus_a", subscription: "sub_a", billingReason: "subscription_create", status: "paid", amountPaid: 799, amountDue: 799, currency: "eur", created: T0, paidAt: T0, attemptCount: 1 },
    { id: "in_c1", customer: "cus_c", subscription: "sub_c", billingReason: "subscription_create", status: "paid", amountPaid: 799, amountDue: 799, currency: "eur", created: T0, paidAt: T0, attemptCount: 1 },
    { id: "in_c2", customer: "cus_c", subscription: "sub_c", billingReason: "subscription_cycle", status: "open", amountPaid: 0, amountDue: 799, currency: "eur", created: T0 + 30 * DAY, paidAt: null, attemptCount: 1 },
  ],
  oneTime: [{ id: "cs_d", customer: "cus_d", userId: "user-d", amountCents: 3000, currency: "eur", created: T0 - 3 * DAY, invoice: null }],
  refunds: [{ id: "re_c", customer: "cus_c", amount: 799, created: T0 + 21 * DAY }],
  disputes: [],
  otherCurrencySubs: 0,
};

// Seuls les commentaires qui parlent de remboursement.
assert.deepEqual(stripeRefundComments(snap).map((r) => r.customer), ["cus_a", "cus_c"]);
// Encaissé : factures payées seulement, plus l'achat à vie sans facture.
assert.equal(paymentsByCustomer(snap).get("cus_c")?.paidCents, 799);
assert.equal(paymentsByCustomer(snap).get("cus_d")?.paidCents, 3000);

const requests = buildRefundRequests(
  [
    ...stripeRefundComments(snap),
    // Garantie d'un acheteur à vie : client Stripe retrouvé par son compte.
    { source: "garantie", at: T0 + 2 * DAY, userId: "user-d", customer: null, text: "Garantie" },
  ],
  snap,
);
// À traiter d'abord (les plus récentes en tête), le remboursé à la fin.
assert.deepEqual(requests.map((r) => r.customer), ["cus_d", "cus_a", "cus_c"]);
const a = requests.find((r) => r.customer === "cus_a")!;
assert.equal(a.daysAfterFirstPayment, 0);
assert.equal(a.withinWithdrawal, true);
assert.equal(a.refundedCents, 0);
const c = requests.find((r) => r.customer === "cus_c")!;
assert.equal(c.daysAfterFirstPayment, 20);
assert.equal(c.withinWithdrawal, false);
assert.equal(c.refundedCents, 799);
const d = requests.find((r) => r.customer === "cus_d")!;
assert.equal(d.userId, "user-d");
assert.equal(d.paidCents, 3000);
assert.equal(d.daysAfterFirstPayment, 5);

// Deux personnes à traiter, toutes deux dans les 14 jours ; une même personne ne compte qu'une fois.
assert.deepEqual(pendingPeople(requests), { total: 2, withinWithdrawal: 2 });
assert.deepEqual(pendingPeople([...requests, { ...a, source: "questionnaire", at: a.at + 1000 }]), { total: 2, withinWithdrawal: 2 });

// Procédure : accusé « on traite ta demande », puis mois offert 20 jours après.
const ack = renderRefundAckEmail("Léa Martin");
assert.equal(ack.subject, "On traite ta demande de remboursement");
assert.match(ack.text, /^Salut Léa,/);
assert.match(ack.text, /On la traite et on te répond au plus vite\./);
assert.doesNotMatch(ack.text, /rembourser? sous|on te rembourse/i);
assert.match(renderRefundAckEmail(null).text, /^Salut,/);
assert.match(renderRefundAckEmail("<b>x</b>").html, /&lt;b&gt;/);
const month = renderFreeMonthEmail("Léa", "26 décembre");
assert.match(month.text, /on ne peut pas te rembourser/);
assert.match(month.text, /prolongé jusqu'au 26 décembre, sans aucun prélèvement/);
assert.equal(followUpAt(T0) - T0, 20 * DAY);

console.log("remboursements.test.ts OK");
