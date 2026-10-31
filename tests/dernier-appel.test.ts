// Campagne « Dernier appel » (31/10) : un email, l'accès à vie, chaque phrase vraie à l'envoi.
// Lancer : npx tsx --tsconfig tsconfig.json tests/dernier-appel.test.ts
import assert from "node:assert/strict";
import { renderLastCallEmail } from "../src/lib/campaigns/dernierAppel";
import { CAMPAIGNS, LASTCALL_BATCH_SIZE, LASTCALL_CAMPAIGN_EVENT, campaignFrom, type CampaignProfile } from "../src/lib/campaigns/relanceOffres";
import { PLAN_PRICES } from "../src/lib/pricing/plans";

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

const mail = renderLastCallEmail(profile);
// Les prix sont ceux du site (jamais écrits à part).
assert.ok(mail.subject.includes(PLAN_PRICES.lifetime.welcome));
for (const body of [mail.html, mail.text]) {
  assert.ok(body.includes(PLAN_PRICES.lifetime.welcome), "prix à vie");
  assert.ok(body.includes(PLAN_PRICES.lifetime.regular), "prix d'après");
  assert.ok(body.includes("10 minutes"), "le vrai délai");
  assert.ok(body.includes("/premium/go?plan=lifetime&utm_source=email&utm_medium=campagne&utm_campaign=dernier_appel_2026_10"));
  assert.ok(body.includes(`/api/unsubscribe?u=${profile.id}`), "désabonnement en un clic");
  assert.ok(!/\{\{|undefined|null|NaN/.test(body), "aucun reste de gabarit");
  // Pas de fausse urgence ni de promesse non tenue.
  assert.ok(!/rembours/i.test(body), "aucune garantie de remboursement sur l'accès à vie");
  assert.ok(!/plus que \d+|il reste \d+|\d+ places/i.test(body), "aucun nombre de places inventé");
}
assert.match(mail.html, />Léa,</, "prénom lu et mis en forme");
assert.match(renderLastCallEmail({ ...profile, full_name: null }).text, /^Salut,/);
assert.match(renderLastCallEmail({ ...profile, full_name: "<b>x" }).html, /<p>&lt;b&gt;x,<\/p>/, "prénom échappé");

// La campagne est branchée.
assert.equal(campaignFrom("dernierappel"), CAMPAIGNS.dernierappel);
assert.equal(campaignFrom("offres"), CAMPAIGNS.offres);
assert.equal(campaignFrom("n'importe quoi"), CAMPAIGNS.nouveautes);
assert.equal(CAMPAIGNS.dernierappel.event, LASTCALL_CAMPAIGN_EVENT);
assert.equal(CAMPAIGNS.dernierappel.batch, LASTCALL_BATCH_SIZE);
assert.notEqual(LASTCALL_CAMPAIGN_EVENT, CAMPAIGNS.nouveautes.event);
assert.notEqual(LASTCALL_CAMPAIGN_EVENT, CAMPAIGNS.offres.event);

console.log("dernier-appel : OK");
