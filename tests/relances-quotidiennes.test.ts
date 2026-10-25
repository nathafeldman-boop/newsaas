// Relances quotidiennes (25/10) : la série Premium envoie toujours le même
// email (le n°1), et le panier abandonné ne vise que les vrais paiements
// non finalisés de Stageio.
// Lancer : npx tsx --tsconfig tsconfig.json tests/relances-quotidiennes.test.ts
import assert from "node:assert/strict";
import { compactCatalog, renderSeriesEmail } from "../src/lib/campaigns/serieVente";
import { countForProfile } from "../src/lib/campaigns/relanceOffres";
import { attributeEmailRevenue } from "../src/lib/admin/emailRevenue";
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

// Catalogue compact (en cache) : mêmes nombres que le catalogue complet.
{
  const o = (i: number, contract_type: "alternance" | "stage", sector: string | null, location: string) => ({
    id: `o${i}`, title: `Offre ${i}`, company: "X", contract_type, sector, location, created_at: new Date(NOW - i * H).toISOString(),
  });
  const full = { offers: [o(1, "alternance", "Commerce", "69 - Lyon 3e"), o(2, "alternance", "Commerce", "69 - Lyon 3e"), o(3, "stage", "Commerce", "69 - Lyon 3e"), o(4, "alternance", "Informatique", "75 - Paris"), o(5, "alternance", "Commerce", "Villeurbanne")] };
  const compact = compactCatalog(full);
  assert.equal(compact.offers.length, 4);
  const lyon = { ...profile, city: "Lyon", sectors: ["Commerce"] } as typeof profile;
  assert.equal(countForProfile(compact, lyon).matching, countForProfile(full, lyon).matching);
  assert.equal(countForProfile(compact, profile).matching, countForProfile(full, profile).matching);
}

// Ce que rapporte chaque e-mail : paiement rattaché au dernier e-mail des 48 h, au jour de l'e-mail.
{
  const day1 = Date.parse("2026-10-24T08:00:00Z");
  const day2 = Date.parse("2026-10-25T08:00:00Z");
  const rows = attributeEmailRevenue(
    [
      { userId: "a", at: day1, source: "serie" },
      { userId: "a", at: day2, source: "panier" },
      { userId: "b", at: day1, source: "serie" },
      { userId: "c", at: day1, source: "serie" },
    ],
    [
      { userId: "a", at: day2 + 2 * H, cents: 799 }, // dernier e-mail : le panier du 25
      { userId: "b", at: day1 + 3 * H, cents: 3000 }, // série du 24
      { userId: "c", at: day1 + 3 * D, cents: 799 }, // trop tard : non attribué
      { userId: "z", at: day1, cents: 799 }, // aucun e-mail
    ],
    ["serie", "panier"],
    ["2026-10-24", "2026-10-25"],
  );
  assert.deepEqual(rows[0].bySource.serie, { sent: 3, payers: 1, cents: 3000 });
  assert.deepEqual(rows[1].bySource.panier, { sent: 1, payers: 1, cents: 799 });
  assert.deepEqual(rows[1].bySource.serie, { sent: 0, payers: 0, cents: 0 });
}

console.log("relances-quotidiennes : OK");
