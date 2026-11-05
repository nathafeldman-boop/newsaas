// Salve « offre de l'email » du 5/11 : Premium à vie 30 €, Auto à vie 63,23 €,
// prix bloqué 20 minutes après le clic, lien valable 48 h, 400 emails.
// Lancer : npx tsx --tsconfig tsconfig.json tests/offre-48h.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OFFER48_NEWS,
  OFFER48_SALVE_END,
  OFFER48_SALVE_START,
  OFFER48_SALVE_TOTAL,
  offer48Deadline,
  planOffer48Salve,
  renderOffer48Email,
} from "../src/lib/campaigns/offre48";
import { CAMPAIGNS, OFFER48_CAMPAIGN_EVENT, campaignFrom, renderForCampaign, type CampaignProfile } from "../src/lib/campaigns/relanceOffres";
import { AUTO_PRICES, EMAIL_OFFER, FLASH_OFFER, PLAN_PRICES, emailOfferEnd, lifetimeOfferFor } from "../src/lib/pricing/plans";

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
assert.equal(EMAIL_OFFER.windowMs, 20 * 60_000, "20 minutes pour choisir");
assert.equal(EMAIL_OFFER.linkMs, 48 * 3_600_000, "le lien marche 48 h");

// L'email : envoyé jeudi 5/11 à 18 h 05 (Paris), le lien marche jusqu'à samedi 18 h 05.
const sentAt = Date.parse("2026-11-05T17:05:12Z");
assert.equal(offer48Deadline(sentAt + EMAIL_OFFER.linkMs), "samedi 7 novembre à 18 h 05");
const mail = renderOffer48Email(profile, sentAt);
assert.equal(mail.subject, "⏳ Léa, Stageio à vie à 30 €, réservé à cet email");
for (const body of [mail.html.replace(/&nbsp;/g, " "), mail.text]) {
  assert.ok(body.includes("samedi 7 novembre à 18 h 05"), "la vraie fin du lien");
  assert.ok(body.includes("20 minutes"), "le vrai délai");
  assert.ok(body.includes("30 €") && body.includes("63,23 €"), "les deux prix");
  assert.ok(body.includes("50 €"), "la hausse annoncée par Nathan");
  assert.ok(body.includes(PLAN_PRICES.lifetime.regular) && body.includes(AUTO_PRICES.lifetime.regular), "le prix d'après");
  assert.ok(body.includes(PLAN_PRICES.monthly.welcome), "le mensuel de bienvenue");
  assert.ok(OFFER48_NEWS.every((n) => body.includes(n.title)), "les nouveautés");
  assert.ok(body.includes("/premium/go?plan=lifetime&utm_source=email&utm_medium=campagne&utm_campaign=offre_48h_2026_11"));
  assert.ok(body.includes("/premium/go?plan=auto_lifetime&utm_source=email"));
  assert.ok(body.includes("/premium/go?plan=monthly&utm_source=email"));
  assert.ok(!/au lieu de|réduction|remise|-\s?\d+ ?(%|€)|−/i.test(body), "ni prix barré ni réduction");
  assert.ok(body.includes("Ne plus recevoir d'emails de Stageio"));
}
assert.ok(!mail.html.includes("<s>") && !mail.html.includes("line-through"));
assert.equal(renderOffer48Email({ ...profile, full_name: null }, sentAt).subject, "⏳ Stageio à vie à 30 €, réservé à cet email");

// La campagne : 400 par clic dans l'admin aussi, même message pour tous.
assert.equal(CAMPAIGNS.offre48.event, OFFER48_CAMPAIGN_EVENT);
assert.equal(CAMPAIGNS.offre48.batch, 400);
assert.equal(campaignFrom("offre48"), CAMPAIGNS.offre48);
assert.equal(renderForCampaign(CAMPAIGNS.offre48, profile, { offers: [] }).subject, renderOffer48Email(profile).subject);

// Fenêtre d'envoi : 400 en tout, le 5/11 de 18 h à 21 h 55 à Paris.
assert.equal(OFFER48_SALVE_TOTAL, 400);
assert.deepEqual(planOffer48Salve(OFFER48_SALVE_START - 1, 0), { kind: "skipped", reason: "hors_fenetre" });
assert.deepEqual(planOffer48Salve(sentAt, 0), { kind: "run", size: 400 });
assert.deepEqual(planOffer48Salve(sentAt, 150), { kind: "run", size: 250 }, "complète seulement jusqu'à 400");
assert.deepEqual(planOffer48Salve(sentAt, 400), { kind: "skipped", reason: "deja_parti" });
assert.deepEqual(planOffer48Salve(OFFER48_SALVE_END, 0), { kind: "skipped", reason: "hors_fenetre" });
const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync("vercel.json", "utf8")).crons;
const salve = crons.filter((c) => c.path === "/api/cron/offre-48h");
assert.equal(salve.length, 1);
assert.equal(salve[0].schedule, "*/5 17-20 * * *");
const runs = [17, 18, 19, 20].flatMap((h) => Array.from({ length: 12 }, (_, i) => Date.parse(`2026-11-05T${h}:${String(i * 5).padStart(2, "0")}:00Z`)));
assert.ok(runs.every((t) => planOffer48Salve(t, 0).kind === "run"), "chaque passage du 5/11 est dans la fenêtre");
assert.equal(planOffer48Salve(Date.parse("2026-11-06T17:05:00Z"), 0).kind, "skipped", "le lendemain, plus rien");

// L'offre du compte : 20 minutes à partir de la première visite après l'email.
const created = "2026-11-05T17:05:11Z";
const at = Date.parse(created);
assert.equal(emailOfferEnd(null, null, at + 60_000), null, "pas d'email, pas d'offre");
assert.equal(emailOfferEnd(created, null, at + 3_600_000), at + 3_600_000 + EMAIL_OFFER.windowMs, "pas encore venu : les 20 minutes partent maintenant");
const view = "2026-11-05T19:00:00Z";
assert.equal(emailOfferEnd(created, view, Date.parse(view) + 5 * 60_000), Date.parse(view) + EMAIL_OFFER.windowMs, "venu : 20 minutes depuis sa visite, sans repartir");
assert.equal(emailOfferEnd(created, null, at + EMAIL_OFFER.linkMs), null, "lien périmé après 48 h");
const end = Date.parse(view) + EMAIL_OFFER.windowMs;
const offer = lifetimeOfferFor(end, Date.parse(view) + 60_000);
assert.ok(offer && offer.kind === "flash");
assert.equal(offer.price, "30 €");
assert.equal(offer.autoPrice, "63,23 €");
assert.equal(offer.badge, "Offre de l'email");
assert.equal(lifetimeOfferFor(end, end + 1), null, "fini après 20 minutes");

console.log("offre-48h : OK");
