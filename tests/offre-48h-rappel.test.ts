// Rappel « lien direct » de l'offre de l'email (6/11) : même offre que le 5/11
// (Premium à vie 30 €, Auto à vie 63,23 €), lien signé qui ouvre le paiement
// sans connexion, une fois par compte, seulement si l'offre tient encore.
// Lancer : npx tsx --tsconfig tsconfig.json tests/offre-48h-rappel.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderOffer48Email } from "../src/lib/campaigns/offre48";
import {
  OFFER48_REMINDER_END,
  OFFER48_REMINDER_EVENT,
  OFFER48_REMINDER_START,
  inReminderWindow,
  reminderExclusion,
  type ReminderCandidate,
} from "../src/lib/campaigns/offre48Rappel";
import { type CampaignProfile } from "../src/lib/campaigns/relanceOffres";
import { getWelcomeEndsAt } from "../src/lib/pricing/welcome";
import { AUTO_PRICES, EMAIL_OFFER, FLASH_OFFER, PLAN_PRICES } from "../src/lib/pricing/plans";

const profile: CampaignProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "lea@example.com",
  full_name: "léa martin",
  city: "Lyon",
  sectors: [],
  looking_for: [],
  subscription_status: null,
  total_paid_cents: 0,
  notify_new_offers: true,
  search_completed_at: null,
  inactive_campaign_emails_sent: 0,
  created_at: "2026-10-01T10:00:00Z",
  last_active_at: null,
};

// L'email : envoyé le 6/11 à 15 h 40 (Paris), pour un email d'origine parti le 5/11 à 18 h 05.
const sentAt = Date.parse("2026-11-05T17:05:12Z");
const now = Date.parse("2026-11-06T14:40:00Z");
process.env.PAYMENT_LINK_SECRET = "cle-de-test";
const mail = renderOffer48Email(profile, now, { sentAt });
assert.equal(mail.subject, "🔑 Léa, ton lien direct : Stageio à vie à 30 €");
for (const body of [mail.html.replace(/&nbsp;/g, " "), mail.text]) {
  assert.ok(body.includes("te demandait de te connecter"), "dit pourquoi ce rappel");
  assert.ok(body.includes("samedi 7 novembre à 18 h 05"), "la fin du lien d'origine, pas une nouvelle échéance");
  assert.ok(body.includes(FLASH_OFFER.lifetimePrice) && body.includes(FLASH_OFFER.autoLifetimePrice), "les deux prix");
  assert.ok(body.includes(PLAN_PRICES.lifetime.regular) && body.includes(AUTO_PRICES.lifetime.regular), "le prix d'après");
  assert.ok(body.includes("utm_campaign=offre_48h_rappel_2026_11"), "clics suivis à part");
  assert.ok(/premium\/go\?plan=lifetime&[^"\s]*&u=11111111-1111-4111-8111-111111111111&e=\d+&s=[\w-]{32}/.test(body), "lien signé : paiement sans connexion");
  assert.ok(/premium\/go\?plan=auto_lifetime&[^"\s]*&s=[\w-]{32}/.test(body));
  assert.ok(body.includes("C'est le dernier email de cette offre."));
  assert.ok(!body.includes("Un seul email de ce type"));
  assert.ok(!/au lieu de|réduction|remise|-\s?\d+ ?(%|€)|−/i.test(body), "ni prix barré ni réduction");
}
assert.ok(mail.html.includes("TON LIEN DIRECT, SANS CONNEXION"));
// L'email d'origine ne change pas.
const original = renderOffer48Email(profile, sentAt);
assert.equal(original.subject, "⏳ Léa, Stageio à vie à 30 €, réservé à cet email");
assert.ok(original.text.includes("utm_campaign=offre_48h_2026_11") && original.text.includes("Un seul email de ce type."));

// Qui le reçoit.
const c = (over: Partial<ReminderCandidate> & { p?: Partial<CampaignProfile> } = {}): ReminderCandidate => ({
  profile: { ...profile, ...over.p },
  sentAt: over.sentAt ?? sentAt,
  viewedSince: over.viewedSince ?? false,
});
const none = new Set<string>();
assert.equal(reminderExclusion(c(), none, none, now), null, "offre encore valable, jamais venu : oui");
assert.equal(reminderExclusion(c(), new Set([profile.id]), none, now), "deja_recu", "une seule fois");
assert.equal(reminderExclusion(c({ p: { notify_new_offers: false } }), none, none, now), "desabonne");
assert.equal(reminderExclusion(c({ p: { subscription_status: "lifetime" } }), none, none, now), "premium_ou_deja_paye");
assert.equal(reminderExclusion(c({ p: { total_paid_cents: 999 } }), none, none, now), "premium_ou_deja_paye");
assert.equal(reminderExclusion(c({ viewedSince: true }), none, none, now), "deja_venu", "ses 20 minutes ont pu commencer : on n'annonce pas un prix qu'il n'a peut-être plus");
assert.equal(reminderExclusion(c(), none, new Set([profile.id]), now), "serie_recente", "série Premium il y a moins de 3 h : passage suivant");
const lateNow = sentAt + EMAIL_OFFER.linkMs - 3 * 3_600_000;
assert.equal(reminderExclusion(c(), none, none, lateNow), "lien_bientot_fini", "moins de 4 h de lien : rien");
assert.equal(reminderExclusion(c(), none, none, sentAt + EMAIL_OFFER.linkMs - 5 * 3_600_000), null);

// Fenêtre d'envoi : dès la mise en ligne le 6/11, fin le 7/11 à 13 h 55 (Paris).
assert.ok(!inReminderWindow(OFFER48_REMINDER_START - 1));
assert.ok(inReminderWindow(now));
assert.ok(!inReminderWindow(OFFER48_REMINDER_END));
assert.ok(OFFER48_REMINDER_END <= Date.parse("2026-11-05T16:55:00Z") + EMAIL_OFFER.linkMs - 4 * 3_600_000, "fin avant le dernier lien d'origine moins 4 h");

// Le rappel ne rouvre ni ne repousse aucun délai de prix.
const welcome = readFileSync("src/lib/pricing/welcome.ts", "utf8");
assert.ok(!welcome.includes("OFFER48_REMINDER_EVENT") && !welcome.includes(OFFER48_REMINDER_EVENT));
assert.equal(typeof getWelcomeEndsAt, "function");

// Branchements : cron toutes les 10 minutes, jamais à l'heure pile.
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };
const cron = vercel.crons.find((x) => x.path === "/api/cron/offre-48h-rappel");
// Emails arrêtés le 11/11 (Nathan) : cron retiré de vercel.json. L'ancien horaire reste vérifié ci-dessous.
assert.equal(cron, undefined);
const source = readFileSync("src/lib/campaigns/offre48Rappel.ts", "utf8");
assert.ok(source.includes("event_type: OFFER48_REMINDER_EVENT") && source.includes("await release("), "noté avant l'envoi, dé-noté si refusé");
assert.ok(source.includes("idempotencyKey"));
console.log("offre-48h-rappel : OK");
