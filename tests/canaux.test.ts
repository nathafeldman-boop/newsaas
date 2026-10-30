// Revenus par canal (30/10) : attribution des paiements Stripe au canal de la personne, jour par jour, RPM.
// Lancer : npx tsx --tsconfig tsconfig.json tests/canaux.test.ts
import assert from "node:assert/strict";
import { buildChannelReport, channelLabel, channelPayments, rpmCents, UNKNOWN_CHANNEL } from "../src/lib/admin/channels";
import type { StripeSnapshot } from "../src/lib/admin/cockpit/types";

const DAY = 86_400_000;
const start = Date.UTC(2026, 9, 26, 23); // 27/10 minuit à Paris
const range = { start, end: start + 4 * DAY };
const at = (day: number, hour = 10) => start + day * DAY + hour * 3_600_000;
const dayKey = (t: number) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

const snap = {
  subs: [
    { id: "sub_a", customer: "cus_a", userId: "u_tiktok_com" },
    { id: "sub_b", customer: "cus_b", userId: "u_insta_video" },
    { id: "sub_c", customer: "cus_c", userId: "u_old" },
  ],
  invoices: [
    { id: "in_a1", customer: "cus_a", subscription: "sub_a", billingReason: "subscription_create", status: "paid", amountPaid: 799, created: at(0), paidAt: at(0) },
    { id: "in_a2", customer: "cus_a", subscription: "sub_a", billingReason: "subscription_cycle", status: "paid", amountPaid: 799, created: at(2), paidAt: at(2) },
    { id: "in_b1", customer: "cus_b", subscription: "sub_b", billingReason: "subscription_create", status: "paid", amountPaid: 999, created: at(1), paidAt: at(1) },
    // Abonné d'avant la période : renouvellement seulement.
    { id: "in_c0", customer: "cus_c", subscription: "sub_c", billingReason: "subscription_create", status: "paid", amountPaid: 799, created: at(-20), paidAt: at(-20) },
    { id: "in_c1", customer: "cus_c", subscription: "sub_c", billingReason: "subscription_cycle", status: "paid", amountPaid: 799, created: at(3), paidAt: at(3) },
    // Échec : jamais compté.
    { id: "in_x", customer: "cus_b", subscription: "sub_b", billingReason: "subscription_cycle", status: "open", amountPaid: 0, created: at(3), paidAt: null },
  ],
  oneTime: [{ id: "cs_life", customer: "cus_d", userId: "u_tiktok_com2", amountCents: 3000, created: at(1, 20), invoice: "in_d" }],
  refunds: [{ id: "re_1", customer: "cus_b", amount: 999, created: at(3) }],
  disputes: [],
} as unknown as StripeSnapshot;

const { payments, refunds } = channelPayments(snap);
assert.equal(payments.length, 6);
assert.equal(refunds[0].userId, "u_insta_video");

const channelByUser = new Map([
  ["u_tiktok_com", channelLabel({ source: "TikTok", format: "commentaire" }, "tiktok")],
  ["u_tiktok_com2", channelLabel({ source: "TikTok", format: "commentaire" }, null)],
  ["u_insta_video", channelLabel({ source: "Instagram", format: "video" }, null)],
  ["u_old", channelLabel(null, "tiktok")],
  ["u_signup_only", channelLabel(null, null)],
]);
assert.equal(channelByUser.get("u_tiktok_com"), "TikTok · commentaire");
assert.equal(channelByUser.get("u_insta_video"), "Instagram · vidéo");
assert.equal(channelByUser.get("u_old"), "Lien tiktok");
assert.equal(channelByUser.get("u_signup_only"), UNKNOWN_CHANNEL);

const rows = buildChannelReport({
  range,
  payments,
  refunds,
  channelByUser,
  signups: [
    { userId: "u_tiktok_com", at: at(0, 9) },
    { userId: "u_tiktok_com2", at: at(1, 8) },
    { userId: "u_signup_only", at: at(2) },
  ],
  views: [
    { day: dayKey(at(0)), channel: "TikTok · commentaire", views: 20_000 },
    { day: dayKey(at(1)), channel: "TikTok · commentaire", views: 10_000 },
    { day: "2026-10-01", channel: "TikTok · commentaire", views: 99_999 }, // hors période
  ],
  dayKey,
});

const tiktok = rows.find((r) => r.channel === "TikTok · commentaire")!;
assert.equal(rows[0].channel, "TikTok · commentaire"); // classé par encaissements
assert.equal(tiktok.revenueCents, 799 + 799 + 3000);
assert.equal(tiktok.firstCents, 799 + 3000);
assert.equal(tiktok.renewalCents, 799);
assert.equal(tiktok.newPayers, 2);
assert.equal(tiktok.signups, 2);
assert.equal(tiktok.views, 30_000);
assert.deepEqual(tiktok.days.map((d) => d.firstCents), [799, 3000, 0, 0]);
assert.deepEqual(tiktok.days.map((d) => d.renewalCents), [0, 0, 799, 0]);
assert.deepEqual(tiktok.days.map((d) => d.views), [20_000, 10_000, null, null]);
// RPM : 1ers paiements des jours avec vues ÷ (vues ÷ 1000).
assert.equal(rpmCents(tiktok.firstCentsOnViewDays, tiktok.views), Math.round((3799 * 1000) / 30_000));
assert.equal(rpmCents(tiktok.days[0].firstCents, tiktok.days[0].views), 40);

const insta = rows.find((r) => r.channel === "Instagram · vidéo")!;
assert.equal(insta.revenueCents, 999);
assert.equal(insta.refundedCents, 999);
const old = rows.find((r) => r.channel === "Lien tiktok")!;
assert.equal(old.renewalCents, 799);
assert.equal(old.newPayers, 0); // payé pour la 1re fois avant la période
assert.equal(rows.find((r) => r.channel === UNKNOWN_CHANNEL)!.signups, 1);
assert.equal(rpmCents(100, null), null);

console.log(`OK (${rows.length} canaux)`);
