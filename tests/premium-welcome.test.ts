// Accueil des abonnés (29/10) : email de bienvenue, rattrapage, « ta 1re candidature ».
// Lancer : npx tsx --tsconfig tsconfig.json tests/premium-welcome.test.ts
import assert from "node:assert/strict";
import { renderWelcomeEmail, WELCOME_START, welcomeCatchUpDue } from "../src/lib/subscribers/welcome";
import { firstApplicationDue, hasNotAppliedYet, renderFirstApplicationEmail } from "../src/lib/subscribers/firstApplication";

const H = 3_600_000;
const D = 24 * H;
const base = { id: "u1", full_name: "Léa Martin", looking_for: ["alternance" as const], notify_new_offers: true, subscription_status: "active" };

// Premium mensuel : 3 étapes, objectif, résiliation expliquée, réponse à Nathan.
const premium = renderWelcomeEmail(base, "premium");
assert.equal(premium.subject, "Léa, bienvenue dans Premium : tes 3 premières étapes");
assert.match(premium.html, /Prêt à postuler/);
assert.match(premium.html, /ton alternance en 2 mois maximum/);
assert.match(premium.html, /résilies quand tu veux/);
assert.match(premium.text, /utm_campaign=bienvenue/);
assert.doesNotMatch(premium.html, /rembours/);

// Auto : CV, likes, boîte. À vie : pas de prélèvement à venir. Stage : objectif stage.
const auto = renderWelcomeEmail({ ...base, subscription_status: "lifetime", looking_for: ["stage" as const] }, "auto");
assert.equal(auto.subject, "Léa, bienvenue dans Stageio Auto : tes 3 premières étapes");
assert.match(auto.html, /Ma boîte/);
assert.match(auto.html, /aucun prélèvement à venir/);
assert.match(auto.html, /ton stage en 2 mois maximum/);

// Alertes coupées : on propose de les activer. Sans prénom : « Salut, ».
const noAlerts = renderWelcomeEmail({ ...base, full_name: null, notify_new_offers: false }, "premium");
assert.match(noAlerts.html, /active-les/);
assert.match(noAlerts.html, /<p>Salut,<\/p>/);
assert.equal(noAlerts.subject, "Bienvenue dans Premium : tes 3 premières étapes");

// Rattrapage : 10 min à 48 h après le paiement, jamais avant la mise en ligne.
const paid = WELCOME_START + D;
assert.equal(welcomeCatchUpDue({ premium_activated_at: new Date(paid).toISOString() }, paid + 5 * 60_000), false);
assert.equal(welcomeCatchUpDue({ premium_activated_at: new Date(paid).toISOString() }, paid + H), true);
assert.equal(welcomeCatchUpDue({ premium_activated_at: new Date(paid).toISOString() }, paid + 49 * H), false);
assert.equal(welcomeCatchUpDue({ premium_activated_at: new Date(WELCOME_START - H).toISOString() }, WELCOME_START), false);
assert.equal(welcomeCatchUpDue({ premium_activated_at: null }, paid), false);

// « Ta 1re candidature » : entre 20 h et 7 jours, emails acceptés.
const at = new Date(paid).toISOString();
assert.equal(firstApplicationDue({ premium_activated_at: at, notify_new_offers: true }, paid + 10 * H), false);
assert.equal(firstApplicationDue({ premium_activated_at: at, notify_new_offers: true }, paid + 22 * H), true);
assert.equal(firstApplicationDue({ premium_activated_at: at, notify_new_offers: false }, paid + 22 * H), false);
assert.equal(firstApplicationDue({ premium_activated_at: at, notify_new_offers: true }, paid + 8 * D), false);

// Une lettre « à préparer » ou une candidature clôturée n'est pas un envoi ; une spontanée, si.
assert.equal(hasNotAppliedYet([], 0), true);
assert.equal(hasNotAppliedYet(["a_preparer", "cloturee"], 0), true);
assert.equal(hasNotAppliedYet(["envoyee"], 0), false);
assert.equal(hasNotAppliedYet([], 1), false);

const offers = [
  { id: "o1", title: "Assistant marketing", company: "Acme", location: "Lyon" },
  { id: "o2", title: "Chargé de com", company: "Beta & Co", location: "Lyon" },
];
const nudge = renderFirstApplicationEmail({ id: "u1", full_name: "Léa Martin" }, offers, false);
assert.equal(nudge.subject, "Léa, ta 1re candidature en 2 minutes");
assert.match(nudge.html, /\/candidature\/o1\?utm_source=email/);
assert.match(nudge.html, /Beta &amp; Co/);
assert.match(nudge.html, /la lettre est déjà écrite/);
assert.match(nudge.html, /Ne plus recevoir ces emails/);
assert.match(renderFirstApplicationEmail({ id: "u1", full_name: null }, offers, true).html, /un like suffit/);

console.log("premium-welcome : OK");
