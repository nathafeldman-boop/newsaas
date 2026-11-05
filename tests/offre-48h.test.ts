// Salve « offre 48 h » du 5/11 : Premium à vie 30 €, Auto à vie 63,23 €, 400 emails.
// Lancer : npx tsx --tsconfig tsconfig.json tests/offre-48h.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OFFER48_SALVE_END,
  OFFER48_SALVE_START,
  OFFER48_SALVE_TOTAL,
  offer48Deadline,
  planOffer48Salve,
  renderOffer48Email,
} from "../src/lib/campaigns/offre48";
import { CAMPAIGNS, OFFER48_CAMPAIGN_EVENT, campaignFrom, renderForCampaign, type CampaignProfile } from "../src/lib/campaigns/relanceOffres";
import { AUTO_PRICES, FLASH_OFFER, PLAN_PRICES, flashEndFrom, lifetimeOfferFor } from "../src/lib/pricing/plans";

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

// Les prix demandés, et le prix Stripe qui va avec.
assert.equal(FLASH_OFFER.lifetimePrice, "30 €");
assert.equal(FLASH_OFFER.autoLifetimePrice, "63,23 €");
assert.equal(FLASH_OFFER.autoLifetimeCents, 6323);
assert.match(FLASH_OFFER.autoLifetimePriceId, /^price_/);

// L'email : envoyé le jeudi 5/11 à 18 h 05 (Paris), l'offre finit samedi à 18 h 05.
const sentAt = Date.parse("2026-11-05T17:05:12Z");
assert.equal(offer48Deadline(sentAt + FLASH_OFFER.windowMs), "samedi 7 novembre à 18 h 05");
const mail = renderOffer48Email(profile, sentAt);
assert.ok(mail.subject.startsWith("🎁 Léa, 48 h rien que pour toi"), mail.subject);
assert.ok(mail.subject.includes("30 €"));
for (const body of [mail.html.replace(/&nbsp;/g, " "), mail.text]) {
  assert.ok(body.includes("samedi 7 novembre à 18 h 05"), "la vraie fin de l'offre");
  assert.ok(body.includes("30 €") && body.includes("63,23 €"), "les deux prix");
  assert.ok(body.includes(PLAN_PRICES.lifetime.regular) && body.includes(AUTO_PRICES.lifetime.regular), "le prix d'après");
  assert.ok(body.includes(PLAN_PRICES.monthly.welcome), "le mensuel de bienvenue");
  assert.ok(body.includes("/premium/go?plan=lifetime&utm_source=email&utm_medium=campagne&utm_campaign=offre_48h_2026_11"));
  assert.ok(body.includes("/premium/go?plan=auto_lifetime&utm_source=email"));
  assert.ok(body.includes("/premium/go?plan=monthly&utm_source=email"));
  assert.ok(!/au lieu de|réduction|-\d+ ?%/i.test(body), "ni prix barré ni réduction");
  assert.ok(body.includes("Ne plus recevoir d'emails de Stageio"));
}
assert.ok(!mail.html.includes("<s>") && !mail.html.includes("line-through"));
assert.equal(renderOffer48Email({ ...profile, full_name: null }, sentAt).subject, "🎁 48 h rien que pour toi : Premium à vie à 30 €");

// La campagne : 400 par clic dans l'admin aussi, même message pour tous.
assert.equal(CAMPAIGNS.offre48.event, OFFER48_CAMPAIGN_EVENT);
assert.equal(CAMPAIGNS.offre48.batch, 400);
assert.equal(campaignFrom("offre48"), CAMPAIGNS.offre48);
assert.equal(renderForCampaign(CAMPAIGNS.offre48, profile, { offers: [] }).subject, renderOffer48Email(profile).subject);

// Fenêtre d'envoi : 400 en tout, de 18 h à 21 h 05 à Paris le 5/11.
assert.equal(OFFER48_SALVE_TOTAL, 400);
assert.deepEqual(planOffer48Salve(OFFER48_SALVE_START - 1, 0), { kind: "skipped", reason: "hors_fenetre" });
assert.deepEqual(planOffer48Salve(sentAt, 0), { kind: "run", size: 400 });
assert.deepEqual(planOffer48Salve(sentAt, 150), { kind: "run", size: 250 }, "complète seulement jusqu'à 400");
assert.deepEqual(planOffer48Salve(sentAt, 400), { kind: "skipped", reason: "deja_parti" });
assert.deepEqual(planOffer48Salve(OFFER48_SALVE_END, 0), { kind: "skipped", reason: "hors_fenetre" });
const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync("vercel.json", "utf8")).crons;
const salve = crons.filter((c) => c.path === "/api/cron/offre-48h");
assert.equal(salve.length, 1);
assert.equal(salve[0].schedule, "5 17-20 * * *");
const runs = [17, 18, 19, 20].map((h) => Date.parse(`2026-11-05T${h}:05:00Z`));
assert.ok(runs.every((t) => planOffer48Salve(t, 0).kind === "run"), "chaque passage du 5/11 est dans la fenêtre");
assert.equal(planOffer48Salve(Date.parse("2026-11-06T17:05:00Z"), 0).kind, "skipped", "le lendemain, plus rien");

// L'offre du compte : 48 h après l'email (la plus récente des ouvertures).
const created = "2026-11-05T17:05:11Z";
assert.equal(flashEndFrom([null, created]), Date.parse(created) + FLASH_OFFER.windowMs);
assert.equal(flashEndFrom(["2026-10-30T10:00:00Z", created]), Date.parse(created) + FLASH_OFFER.windowMs, "une vieille offre finie ne bloque pas la nouvelle");
assert.equal(flashEndFrom([null, null]), null);
const offer = lifetimeOfferFor(Date.parse(created) + FLASH_OFFER.windowMs, sentAt);
assert.ok(offer && offer.kind === "flash");
assert.equal(offer.price, "30 €");
assert.equal(offer.autoPrice, "63,23 €");
assert.equal(lifetimeOfferFor(Date.parse(created) + FLASH_OFFER.windowMs, Date.parse(created) + FLASH_OFFER.windowMs + 1), null, "fini après 48 h");

console.log("offre-48h : OK");
