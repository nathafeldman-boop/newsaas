// Campagne « nouveautés » (29/10) : nouveautés + objectif dans la série, email n° 6 une fois pour les comptes qui avaient fini la série.
// Lancer : npx tsx --tsconfig tsconfig.json tests/nouveautes.test.ts
import assert from "node:assert/strict";
import { NEWS_LAUNCH, NEWS_STEP, renderSeriesEmail } from "../src/lib/campaigns/serieVente";
import { FLASH_OFFER } from "../src/lib/pricing/plans";
import type { CampaignProfile } from "../src/lib/campaigns/relanceOffres";

const H = 3_600_000;
const D = 24 * H;
const profile = (lookingFor: string[]) =>
  ({
    id: "u1", email: "lea@example.com", full_name: "Léa Martin", city: null, sectors: [], looking_for: lookingFor,
    subscription_status: null, total_paid_cents: 0, notify_new_offers: true, search_completed_at: null, inactive_campaign_emails_sent: 0,
    created_at: new Date(NEWS_LAUNCH - 10 * D).toISOString(), last_active_at: null, current_period_end: null,
  }) as unknown as CampaignProfile & { current_period_end: string | null };
const catalog = { offers: [] };
const lea = profile(["alternance"]);

// Avant le lancement : l'email d'avant, sans les nouveautés.
const before = renderSeriesEmail(lea, 2, catalog, NEWS_LAUNCH - H);
assert.ok(!before.html.includes("Nouveau sur Stageio"));

// Après : nouveautés, objectif écrit comme un objectif, garantie avec ses conditions.
const after = renderSeriesEmail(lea, 2, catalog, NEWS_LAUNCH + 2 * H);
assert.equal(after.subject, "Léa, notre objectif : ton alternance en 2 mois maximum");
for (const s of ["Nouveau sur Stageio", "Candidatures spontanées", "Stageio Auto", "jusqu&#39;à 100 par jour", "Relances", "Alertes", "Entretiens", "Notre objectif : ton alternance en 2 mois maximum", "on te rembourse", "/legal/cgv"]) {
  assert.ok(after.html.includes(s), `manque : ${s}`);
}
assert.ok(after.text.includes("Nouveau sur Stageio :") && after.text.includes("- Candidatures spontanées :"));
assert.ok(!/en 2 jours|garanti(e)? en|trouve(ras)? ton alternance en/i.test(after.html), "aucune promesse de résultat");
assert.ok(after.html.includes("9,99&nbsp;€") && after.html.includes("Moins de 35 centimes par jour"));
assert.ok(after.html.includes("Série de 5 emails au plus"));

// Stage : « ton stage ».
assert.equal(renderSeriesEmail(profile(["stage"]), 1, catalog, NEWS_LAUNCH + H).subject, "Léa, notre objectif : ton stage en 2 mois maximum");

// Offre 48 h ouverte après le lancement : nouveau sujet, 9,99 €/mois et l'accès à vie à 30 €.
const opening = renderSeriesEmail(lea, 1, catalog, NEWS_LAUNCH + H, 0, NEWS_LAUNCH + H + FLASH_OFFER.windowMs);
assert.equal(opening.subject, "🚀 Léa, le nouveau Stageio est là, et 48 h rien que pour toi");
assert.ok(opening.html.includes("Nouveau sur Stageio") && opening.html.includes("30&nbsp;€") && opening.html.includes("9,99&nbsp;€/mois"));

// Email n° 6 (série déjà finie) : même contenu, lien suivi à part, et il dit qu'il n'y en aura pas d'autre.
const sixth = renderSeriesEmail(lea, NEWS_STEP, catalog, NEWS_LAUNCH + 3 * H);
assert.equal(sixth.subject, after.subject);
assert.ok(sixth.html.includes("serie-premium-6"));
assert.ok(sixth.html.includes("un seul email pour te présenter les nouveautés") && !sixth.html.includes("Série de 5 emails"));

console.log("nouveautes: ok");
