// Relances quotidiennes (25/10) : la série Premium envoie toujours le même
// email (le n°1), et le panier abandonné ne vise que les vrais paiements
// non finalisés de Stageio.
// Lancer : npx tsx --tsconfig tsconfig.json tests/relances-quotidiennes.test.ts
import assert from "node:assert/strict";
import { renderSeriesEmail } from "../src/lib/campaigns/serieVente";
import { abandonedUsers } from "../src/lib/campaigns/relanceCheckoutDaily";
import type { CampaignProfile } from "../src/lib/campaigns/relanceOffres";

const H = 3_600_000;
const D = 24 * H;
const NOW = Date.parse("2026-10-26T09:00:00Z");

// Même email à chaque envoi, quel que soit le numéro ; jamais la promo terminée.
const profile = {
  id: "u1", email: "lea@example.com", full_name: "Léa Martin", city: null, sectors: [], looking_for: ["alternance"],
  subscription_status: null, total_paid_cents: 0, notify_new_offers: true, search_completed_at: null, inactive_campaign_emails_sent: 0,
  created_at: new Date(NOW - 10 * D).toISOString(), last_active_at: null, current_period_end: null,
} as unknown as CampaignProfile & { current_period_end: string | null };
const catalog = { offers: [] };
const first = renderSeriesEmail(profile, 1, catalog, NOW);
for (const step of [2, 3, 4, 5]) {
  const e = renderSeriesEmail(profile, step, catalog, NOW);
  assert.equal(e.subject, first.subject, `envoi n°${step}`);
  assert.ok(e.html.includes(`serie-premium-${step}`), "le lien garde son numéro pour les statistiques");
}
assert.ok(!/30&nbsp;€|jusqu'à cette nuit/.test(first.html), "la promo du 24/10 est terminée");

// Panier abandonné : relancé entre 1 h et 7 jours après sa tentative, jamais s'il a payé.
const s = (userId: string, agoMs: number, status: "open" | "expired" | "complete" = "expired", paid = false) => ({ userId, created: NOW - agoMs, status, paid });
assert.deepEqual(
  abandonedUsers(
    [
      s("abandon-hier", D),
      s("trop-recent", 20 * 60_000, "open"),
      s("a-paye", 2 * D),
      s("a-paye", D, "complete", true),
      s("trop-vieux", 8 * D),
      s("deux-essais", 3 * D),
      s("deux-essais", 2 * D),
    ],
    NOW,
  ).sort(),
  ["abandon-hier", "deux-essais"],
);

console.log("relances-quotidiennes : OK");
