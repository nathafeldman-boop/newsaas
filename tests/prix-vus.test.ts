// Email « tu as regardé Premium » (7/11) : comptes venus sur la page Premium
// dans les 7 derniers jours sans payer, une fois par compte, de 9 h à midi.
// Lancer : npx tsx --tsconfig tsconfig.json tests/prix-vus.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRICES_SEEN_DAY_START,
  PRICES_SEEN_END,
  PRICES_SEEN_START,
  inPricesSeenWindow,
  pricesSeenExclusion,
  renderPricesSeenEmail,
  type PricesSeenCandidate,
} from "../src/lib/campaigns/prixVus";
import { PRICES_SEEN_EVENT } from "../src/lib/campaigns/serieEvents";
import { type CampaignProfile, type Catalog } from "../src/lib/campaigns/relanceOffres";
import { goPlanOffer } from "../src/lib/premium/goOffer";
import { PLAN_PRICES } from "../src/lib/pricing/plans";
import { verifyGoParams } from "../src/lib/premium/goLink";

process.env.PAYMENT_LINK_SECRET = "cle-de-test";

const profile: CampaignProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "ines@example.com",
  full_name: "Inès Martin",
  city: "Lyon",
  sectors: [],
  looking_for: ["alternance"],
  subscription_status: null,
  total_paid_cents: 0,
  notify_new_offers: true,
  search_completed_at: null,
  inactive_campaign_emails_sent: 0,
  created_at: "2026-10-20T10:00:00Z",
  last_active_at: "2026-11-05T18:00:00Z",
};
const now = Date.parse("2026-11-07T08:03:00Z");
const lastViewAt = Date.parse("2026-11-05T18:02:00Z");
const candidate: PricesSeenCandidate = { profile, lastViewAt };

// Fenêtre : 9 h à midi à Paris, le 7/11 seulement.
assert.equal(inPricesSeenWindow(PRICES_SEEN_START), true);
assert.equal(inPricesSeenWindow(now), true);
assert.equal(inPricesSeenWindow(PRICES_SEEN_START - 1), false);
assert.equal(inPricesSeenWindow(PRICES_SEEN_END), false);
assert.equal(new Date(PRICES_SEEN_START).toISOString(), "2026-11-07T08:00:00.000Z");
// « Aujourd'hui » = depuis minuit à Paris.
assert.equal(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(PRICES_SEEN_DAY_START), "07/11/2026 00:00");

// Le cron tombe dans la fenêtre (8 h 03 à 10 h 53 UTC).
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };
const cron = vercel.crons.find((c) => c.path === "/api/cron/prix-vus");
assert.ok(cron, "cron prix-vus présent");
assert.equal(cron!.schedule, "3-53/10 8-10 * * *");
assert.equal(inPricesSeenWindow(Date.parse("2026-11-07T10:53:00Z")), true);

// Exclusions.
const none = new Set<string>();
assert.equal(pricesSeenExclusion(candidate, none, none, none, now), null);
assert.equal(pricesSeenExclusion(candidate, new Set([profile.id]), none, none, now), "deja_recu");
assert.equal(pricesSeenExclusion(candidate, none, new Set([profile.id]), none, now), "offre_du_5_11");
assert.equal(pricesSeenExclusion(candidate, none, none, new Set([profile.id]), now), "email_aujourdhui");
assert.equal(pricesSeenExclusion({ ...candidate, profile: { ...profile, subscription_status: "active" } }, none, none, none, now), "premium_ou_deja_paye");
assert.equal(pricesSeenExclusion({ ...candidate, profile: { ...profile, total_paid_cents: 999 } }, none, none, none, now), "premium_ou_deja_paye");
assert.equal(pricesSeenExclusion({ ...candidate, profile: { ...profile, notify_new_offers: false } }, none, none, none, now), "desabonne");
assert.equal(pricesSeenExclusion({ ...candidate, profile: { ...profile, email: null } }, none, none, none, now), "sans_email");
assert.equal(pricesSeenExclusion({ ...candidate, profile: { ...profile, search_completed_at: "2026-11-06T10:00:00Z" } }, none, none, none, now), "recherche_terminee");

// L'email : les offres d'abord (les plus récentes qui collent), puis Premium aux vrais prix.
const catalog: Catalog = {
  offers: [
    { id: "o1", title: "Chargé de recrutement (H/F)", company: "Acme RH", contract_type: "alternance", sector: null, location: "69 - Lyon 3e", created_at: "2026-11-06T22:00:00Z" },
    { id: "o2", title: "Assistant <communication>", company: "Com & Co", contract_type: "alternance", sector: null, location: "69 - Villeurbanne", created_at: "2026-11-06T09:00:00Z" },
    { id: "o3", title: "Comptable", company: "Chiffres SA", contract_type: "alternance", sector: null, location: "69 - Lyon 7e", created_at: "2026-11-01T09:00:00Z" },
    { id: "o4", title: "Stagiaire marketing", company: "Paris Corp", contract_type: "stage", sector: null, location: "75 - Paris", created_at: "2026-11-06T23:00:00Z" },
  ],
};
const mail = renderPricesSeenEmail(profile, catalog, lastViewAt);
assert.match(mail.subject, /9,99 €\/mois/);
assert.match(mail.html, /Salut Inès,/);
assert.match(mail.html, /<strong>Chargé de recrutement<\/strong>/, "« (H/F) » retiré");
assert.match(mail.html, /Acme RH · Lyon 3e/);
assert.match(mail.html, /Assistant &lt;communication&gt;/, "texte échappé");
assert.ok(!mail.html.includes("Stagiaire marketing"), "pas d'offre hors de sa recherche");
assert.ok(mail.html.indexOf("Chargé de recrutement") < mail.html.indexOf("Débloquer Premium"), "les offres avant le prix");
assert.match(mail.html, new RegExp(`${PLAN_PRICES.monthly.welcome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/mois sans engagement`));
assert.match(mail.html, new RegExp(`ou ${PLAN_PRICES.lifetime.welcome} une fois pour toujours`));
assert.match(mail.html, /10 minutes à partir de ton clic/);
assert.ok(!/réduction|au lieu de|line-through|<s>|<del>/i.test(mail.html), "ni prix barré ni réduction");
assert.match(mail.text, /Ne plus recevoir d'emails de Stageio : https:\/\/.+/);

// Le bouton Premium : lien signé du compte, formule « choix », suivi prix-vus.
const premiumHref = mail.html.match(/href="([^"]*premium\/go[^"]*)"/)?.[1];
assert.ok(premiumHref, "bouton Premium présent");
const url = new URL(premiumHref!.replace(/&amp;/g, "&"));
assert.equal(url.searchParams.get("plan"), "choix");
assert.equal(url.searchParams.get("utm_campaign"), "prix-vus");
assert.equal(verifyGoParams({ u: url.searchParams.get("u"), e: url.searchParams.get("e"), s: url.searchParams.get("s") }, now), profile.id);

// Les prix écrits sont ceux de la page de paiement pendant les 10 minutes (prix de bienvenue).
const welcome = { active: true, endsAt: now + 10 * 60_000, flashEndsAt: null, legacy: false };
assert.equal(goPlanOffer("monthly", welcome, now).price, PLAN_PRICES.monthly.welcome);
assert.equal(goPlanOffer("lifetime", welcome, now).price, PLAN_PRICES.lifetime.welcome);
assert.equal(PLAN_PRICES.monthly.welcome, "9,99 €");
assert.equal(PLAN_PRICES.lifetime.welcome, "40 €");

// L'email relance le prix de bienvenue ; la série Premium et les salves sautent ses destinataires le jour même.
assert.ok(readFileSync("src/lib/pricing/welcome.ts", "utf8").includes("PRICES_SEEN_EVENT"), "welcome.ts relance le délai");
assert.ok(readFileSync("src/lib/campaigns/serieVente.ts", "utf8").includes("PRICES_SEEN_EVENT"), "série Premium");
assert.ok(readFileSync("src/app/api/cron/salves-horaires/route.ts", "utf8").includes("PRICES_SEEN_EVENT"), "salves");
assert.equal(PRICES_SEEN_EVENT, "email_prix_vus_2026_11");

// Sans offre qui colle : les plus récentes de son type, sans « pour toi ».
const far: CampaignProfile = { ...profile, city: "Brest" };
const farMail = renderPricesSeenEmail(far, catalog, lastViewAt);
assert.match(farMail.subject, /^Tes offres d'alternance/);
assert.match(farMail.html, /les plus récentes sur Stageio/);

console.log("prix-vus : OK");
