// Satisfaction (29/10) : moments de la question, résumé, résiliations rapides, vérification des liens d'offres.
// Lancer : npx tsx --tsconfig tsconfig.json tests/satisfaction.test.ts
import assert from "node:assert/strict";
import { DISMISS_PAUSE_MS, satisfactionSummary, surveyMomentFor } from "../src/lib/satisfaction/survey";
import { cancelReasons, earlyCancellations } from "../src/lib/satisfaction/stats";
import { isCheckableUrl, verdictFromPage } from "../src/lib/offers/linkCheck";
import { shouldRemoveOffer } from "../src/lib/offers/reports";
import type { SubRecord } from "../src/lib/admin/cockpit/types";

const H = 3_600_000;
const D = 24 * H;
const PAID = Date.parse("2026-10-20T10:00:00Z");

// Moments : pas avant 2 h ; une fois au début, puis J+14, puis J+30.
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [], dismissedAt: null, now: PAID + H }), null);
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [], dismissedAt: null, now: PAID + 3 * H }), "debut");
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [{ at: PAID + 4 * H }], dismissedAt: null, now: PAID + 2 * D }), null);
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [{ at: PAID + 4 * H }], dismissedAt: null, now: PAID + 15 * D }), "j14");
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [{ at: PAID + 4 * H }, { at: PAID + 15 * D }], dismissedAt: null, now: PAID + 20 * D }), null);
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [{ at: PAID + 15 * D }], dismissedAt: null, now: PAID + 31 * D }), "j30");
// Jamais répondu, 20 jours après : on pose celle du moment (J+14), pas celle du début.
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [], dismissedAt: null, now: PAID + 20 * D }), "j14");
// « Plus tard » : pause de 3 jours.
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [], dismissedAt: PAID + 3 * H, now: PAID + 4 * H }), null);
assert.equal(surveyMomentFor({ paidAt: PAID, votes: [], dismissedAt: PAID + 3 * H, now: PAID + 3 * H + DISMISS_PAUSE_MS + 1 }), "debut");
assert.equal(surveyMomentFor({ paidAt: null, votes: [], dismissedAt: null, now: PAID }), null);

const sum = satisfactionSummary([{ score: 5 }, { score: 4 }, { score: 2 }, { score: 1 }]);
assert.equal(sum.n, 4);
assert.equal(sum.csat, 0.5);
assert.equal(sum.average, 3);
assert.deepEqual(sum.counts, [1, 1, 0, 1, 1]);
assert.equal(satisfactionSummary([]).csat, null);

// Résiliations rapides et commentaires (Stripe).
const sub = (o: Partial<SubRecord> & { id: string }): SubRecord => ({
  customer: "c", userId: "u_" + o.id, status: "active", priceIds: ["p"], amountCents: 799, currency: "eur", interval: "month", intervalCount: 1, mrrCents: 799,
  created: PAID, startDate: PAID, anchor: PAID, canceledAt: null, endedAt: null, cancelAt: null, cancelAtPeriodEnd: false, currentPeriodEnd: null,
  cancelReason: null, feedback: null, paused: false, ...o,
});
const subs = [
  sub({ id: "a", canceledAt: PAID + 2 * H, feedback: "other", cancelComment: "Toutes les offres ne sont plus disponibles" }),
  sub({ id: "b", canceledAt: PAID + 3 * D, feedback: "unused" }),
  sub({ id: "c" }),
  sub({ id: "d", startDate: PAID - 90 * D, canceledAt: PAID + D, feedback: "too_expensive" }),
];
const range = { start: PAID - 10 * D, end: PAID + 40 * D };
assert.deepEqual(earlyCancellations(subs, range), { started: 3, day1: 1, day7: 2, day30: 2, any: 2 });
const r = cancelReasons(subs, range);
assert.equal(r.total, 3);
assert.deepEqual(r.byReason.map((x) => [x.label, x.n]).sort(), [["Autre", 1], ["Pas assez utilisé", 1], ["Trop cher", 1]]);
assert.deepEqual(r.comments.map((c) => [c.comment, c.daysAfterStart]), [["Toutes les offres ne sont plus disponibles", 0]]);

// Vérification d'un lien de candidature.
assert.equal(verdictFromPage(404, ""), "dead");
assert.equal(verdictFromPage(410, ""), "dead");
assert.equal(verdictFromPage(403, ""), "unknown");
assert.equal(verdictFromPage(200, "<title>Offre expirée | Site</title><body>…</body>"), "dead");
assert.equal(verdictFromPage(200, "<h1>Cette offre n'est plus disponible</h1>"), "dead");
assert.equal(verdictFromPage(200, "<title>Commercial H/F</title><p>Désolé, cette annonce a été pourvue.</p>"), "suspect");
assert.equal(verdictFromPage(200, "<title>Commercial H/F</title><p>Postuler</p><script>var t='offre expirée'</script>"), "alive");
assert.equal(verdictFromPage(200, "<title>Commercial H/F</title><p>Postuler maintenant</p>"), "alive");
assert.equal(isCheckableUrl("https://www.hellowork.com/fr-fr/emplois/1.html"), true);
assert.equal(isCheckableUrl("http://169.254.169.254/latest/meta-data"), false);
assert.equal(isCheckableUrl("http://localhost:3000/x"), false);
assert.equal(isCheckableUrl("file:///etc/passwd"), false);
assert.equal(isCheckableUrl(null), false);

// Retrait : confirmé par la source, ou plusieurs signalements.
assert.equal(shouldRemoveOffer("dead", 0), true);
assert.equal(shouldRemoveOffer("suspect", 0), false);
assert.equal(shouldRemoveOffer("suspect", 1), true);
assert.equal(shouldRemoveOffer("unknown", 1), true);
assert.equal(shouldRemoveOffer("alive", 1), false);
assert.equal(shouldRemoveOffer("alive", 2), true);

console.log("satisfaction: ok");
