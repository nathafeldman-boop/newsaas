// Paiement refusé = abonnement coupé (4/11) : quand couper, quand laisser la personne régler.
// Lancer : npx tsx --tsconfig tsconfig.json tests/paiement-refuse.test.ts
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { REFUSED_CUT_COMMENT, cutIfPaymentRefused, isRefusedCut, isUnrecoverableDecline, looksRefused } from "../src/lib/stripe/refusedPayment";

// 1. Quels refus sont définitifs.
const failed = (failure_code: string | null, outcome?: { type: string }) => ({ status: "failed" as const, failure_code, outcome });
assert.equal(isUnrecoverableDecline(failed("card_declined")), true);
assert.equal(isUnrecoverableDecline(failed("insufficient_funds")), true);
assert.equal(isUnrecoverableDecline(failed("expired_card")), true);
assert.equal(isUnrecoverableDecline(failed("stolen_card")), true);
assert.equal(isUnrecoverableDecline(failed("card_declined", { type: "blocked" })), true, "bloqué par Radar");
assert.equal(isUnrecoverableDecline(failed(null, { type: "blocked" })), true);
assert.equal(isUnrecoverableDecline(failed("authentication_required")), false, "3D Secure : la personne peut le régler");
assert.equal(isUnrecoverableDecline(failed("processing_error")), false, "panne technique");
assert.equal(isUnrecoverableDecline(failed("issuer_not_available")), false);
assert.equal(isUnrecoverableDecline(failed(null)), false, "pas de code : on ne coupe pas sur un doute");
assert.equal(isUnrecoverableDecline({ status: "succeeded" as never, failure_code: "card_declined" }), false);

// 2. Quand un abonnement a l'air refusé.
const sub = (over: Partial<Stripe.Subscription> = {}) =>
  ({ id: "sub_1", status: "active", customer: "cus_1", latest_invoice: "in_1", pending_update: null, ...over }) as unknown as Stripe.Subscription;
assert.equal(looksRefused(sub({ status: "past_due" })), true);
assert.equal(looksRefused(sub({ status: "unpaid" })), true);
assert.equal(looksRefused(sub({ pending_update: {} as never })), true, "changement d'offre refusé");
assert.equal(looksRefused(sub()), false);

// 3. Couper, ou non, avec un faux Stripe.
type Charge = { status: "failed" | "succeeded"; failure_code: string | null; outcome?: { type: string } };
function fakeStripe(opts: { billingReason?: string; invoiceStatus?: string; attempts?: number; charges?: Charge[] }) {
  const calls = { cancelled: [] as { id: string; params: unknown }[] };
  const stripe = {
    invoices: {
      retrieve: async () =>
        ({ id: "in_1", created: 1_000_000, billing_reason: opts.billingReason ?? "subscription_cycle", status: opts.invoiceStatus ?? "open", attempt_count: opts.attempts ?? 1 }) as unknown as Stripe.Invoice,
    },
    charges: { list: async () => ({ data: (opts.charges ?? [failed("card_declined")]) as never }) },
    subscriptions: {
      cancel: async (id: string, params?: unknown) => {
        calls.cancelled.push({ id, params });
        return {};
      },
    },
  };
  return { stripe, calls };
}

void (async () => {
  // Renouvellement refusé, carte refusée : coupé, sans prorata ni facture, avec la mention lue par l'admin.
  let t = fakeStripe({});
  let r = await cutIfPaymentRefused(t.stripe, sub({ status: "past_due" }));
  assert.deepEqual(r, { cut: true, chargeCode: "card_declined" });
  assert.equal(t.calls.cancelled.length, 1);
  assert.deepEqual(t.calls.cancelled[0], { id: "sub_1", params: { prorate: false, invoice_now: false, cancellation_details: { comment: REFUSED_CUT_COMMENT } } });

  // Passage à Stageio Auto refusé (abonnement encore actif, changement en attente) : coupé aussi.
  t = fakeStripe({ billingReason: "subscription_update", charges: [failed("card_declined", { type: "blocked" })] });
  r = await cutIfPaymentRefused(t.stripe, sub({ pending_update: {} as never }));
  assert.equal(r.cut, true);

  // 3D Secure demandé : rien n'est coupé, la relance habituelle continue.
  t = fakeStripe({ charges: [failed("authentication_required")] });
  assert.deepEqual(await cutIfPaymentRefused(t.stripe, sub({ status: "past_due" })), { cut: false, reason: "refus_recuperable" });
  assert.equal(t.calls.cancelled.length, 0);

  // Le dernier refus fait foi : un 3D Secure récent après un vieux refus ne coupe pas.
  t = fakeStripe({ charges: [failed("authentication_required"), failed("card_declined")] });
  assert.equal((await cutIfPaymentRefused(t.stripe, sub({ status: "past_due" }))).cut, false);

  // Premier paiement (page de paiement Stripe) : jamais coupé par cette règle.
  t = fakeStripe({ billingReason: "subscription_create" });
  assert.equal((await cutIfPaymentRefused(t.stripe, sub({ status: "past_due" }))).cut, false);
  t = fakeStripe({});
  assert.deepEqual(await cutIfPaymentRefused(t.stripe, sub({ status: "incomplete" })), { cut: false, reason: "premier_paiement" });

  // Abonnement sain, déjà arrêté, facture réglée ou jamais tentée, aucun paiement refusé trouvé : rien.
  assert.deepEqual(await cutIfPaymentRefused(fakeStripe({}).stripe, sub()), { cut: false, reason: "pas_un_refus" });
  assert.deepEqual(await cutIfPaymentRefused(fakeStripe({}).stripe, sub({ status: "canceled" })), { cut: false, reason: "deja_arrete" });
  assert.equal((await cutIfPaymentRefused(fakeStripe({ invoiceStatus: "paid" }).stripe, sub({ status: "past_due" }))).cut, false);
  assert.equal((await cutIfPaymentRefused(fakeStripe({ attempts: 0 }).stripe, sub({ status: "past_due" }))).cut, false);
  t = fakeStripe({ charges: [{ status: "succeeded", failure_code: null }] });
  assert.deepEqual(await cutIfPaymentRefused(t.stripe, sub({ status: "past_due" })), { cut: false, reason: "aucun_refus_trouve" });
  assert.equal((await cutIfPaymentRefused(fakeStripe({}).stripe, sub({ status: "past_due", latest_invoice: null }))).cut, false);

  // L'admin reconnaît les abonnements coupés par cette règle.
  assert.equal(isRefusedCut(REFUSED_CUT_COMMENT), true);
  assert.equal(isRefusedCut("Je veux résilier"), false);
  assert.equal(isRefusedCut(null), false);

  console.log("paiement-refuse : OK");
})();
