// Campagne « Dernier appel » (31/10) : un email, l'accès à vie, chaque phrase vraie à l'envoi.
// Lancer : npx tsx --tsconfig tsconfig.json tests/dernier-appel.test.ts
import assert from "node:assert/strict";
import { renderLastCallEmail } from "../src/lib/campaigns/dernierAppel";
import { CAMPAIGNS, LASTCALL_BATCH_SIZE, LASTCALL_CAMPAIGN_EVENT, campaignFrom, type CampaignProfile } from "../src/lib/campaigns/relanceOffres";
import { PLAN_PRICES } from "../src/lib/pricing/plans";
import { readFileSync } from "node:fs";
import {
  LASTCALL_SALVE_SIZE,
  LASTCALL_SALVES_END,
  LASTCALL_SALVES_START,
  inLastCallSalves,
  planLastCallSalve,
} from "../src/lib/campaigns/dernierAppelSalves";
import { sendSeriesRun } from "../src/lib/campaigns/serieVente";

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

// Salves du 1/11 : 300 par heure, de 10 h à 19 h (heure de Paris).
assert.equal(LASTCALL_SALVE_SIZE, 300);
assert.equal(new Date(LASTCALL_SALVES_START).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }), "01/11/2026 10:00:00");
assert.equal(new Date(LASTCALL_SALVES_END).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }), "01/11/2026 20:00:00");
assert.equal(inLastCallSalves(LASTCALL_SALVES_START - 1), false, "pas avant 10 h");
assert.equal(inLastCallSalves(LASTCALL_SALVES_START), true);
assert.equal(inLastCallSalves(LASTCALL_SALVES_END - 1), true);
assert.equal(inLastCallSalves(LASTCALL_SALVES_END), false, "plus rien après 20 h");
assert.equal(inLastCallSalves(Date.parse("2026-11-02T09:00:00Z")), false, "le lendemain, le cron quotidien n'envoie plus");
assert.deepEqual(planLastCallSalve(Date.parse("2026-10-31T09:00:00Z"), 0), { kind: "skipped", reason: "hors_fenetre" });
assert.deepEqual(planLastCallSalve(Date.parse("2026-11-01T09:00:30Z"), 0), { kind: "run", size: 300 });
// Un double appel dans l'heure ne double pas la salve ; un clic de l'admin la consomme.
assert.deepEqual(planLastCallSalve(Date.parse("2026-11-01T09:00:30Z"), 300), { kind: "skipped", reason: "deja_parti" });
assert.deepEqual(planLastCallSalve(Date.parse("2026-11-01T09:00:30Z"), 1000), { kind: "skipped", reason: "deja_parti" });
assert.deepEqual(planLastCallSalve(Date.parse("2026-11-01T10:00:30Z"), 120), { kind: "run", size: 180 }, "on complète jusqu'à 300");

// vercel.json : un passage par heure, tous dans la fenêtre, 10 salves de 300 au plus.
const crons = (JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] }).crons;
const salve = crons.filter((c) => c.path === "/api/cron/dernier-appel");
assert.equal(salve.length, 1);
const hours = /^0 (\d+)-(\d+) \* \* \*$/.exec(salve[0].schedule);
assert.ok(hours, "un passage à l'heure pile, sur une plage d'heures UTC");
const runs: number[] = [];
for (let h = Number(hours[1]); h <= Number(hours[2]); h++) runs.push(Date.parse(`2026-11-01T${String(h).padStart(2, "0")}:00:30Z`));
assert.equal(runs.length, 10);
assert.ok(runs.every(inLastCallSalves), "chaque passage est dans la fenêtre");
assert.equal(inLastCallSalves(runs[runs.length - 1] + 3_600_000), false, "pas de passage de plus");
assert.equal(runs.length * LASTCALL_SALVE_SIZE, 3000);
// Les deux crons de la série et des salves ne se marchent pas dessus : pendant les salves, la série ne part pas.
process.env.RESEND_FROM_EMAIL = "bonjour@example.com";
void (async () => {
  assert.deepEqual(await sendSeriesRun(Date.parse("2026-11-01T09:30:00Z")), { kind: "paused" });
  assert.deepEqual(await sendSeriesRun(Date.parse("2026-11-01T18:30:00Z")), { kind: "paused" });
  console.log("dernier-appel : OK");
})();
