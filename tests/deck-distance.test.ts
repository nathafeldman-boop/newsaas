// « C'est trop loin » (30/10) : les nouveautés lointaines ne passent plus devant les offres proches.
// Lancer : npx tsx --tsconfig tsconfig.json tests/deck-distance.test.ts
import assert from "node:assert/strict";
import { computeMatchScore, geoMatch } from "../src/lib/matching/score";
import { orderFreshFirst } from "../src/lib/offers/freshness";
import type { Offer, Profile } from "../src/types/database";

const NOW = Date.parse("2026-10-30T15:00:00Z");
const H = 3_600_000, D = 24 * H;
let n = 0;
const offer = (title: string, location: string, ageMs: number): Offer => ({
  id: `o${++n}`, title, company: `E${n}`, location, contract_type: "alternance", sector: "Commerce", description: "Vente.", requirements: null,
  duration: null, salary: null, remote_policy: "onsite", start_date: null, education_level: "Bac+2", image_url: null, apply_url: null,
  source: "france_travail", source_url: null, external_id: null, is_active: true, published_at: new Date(NOW - ageMs).toISOString(),
  created_at: new Date(NOW - ageMs).toISOString(), last_seen_at: new Date(NOW).toISOString(), content_fingerprint: null, quality_score: 70,
});
const profile = { city: "Lyon", mobility: "Sur place uniquement", looking_for: ["alternance"], sectors: ["Commerce"], target_jobs: ["Vendeur"], skills: [], education_level: "Bac+2" } as unknown as Profile;

// 12 offres à Lyon (2 à 10 jours), 40 nouveautés de moins de 24 h à Paris, du métier visé.
const local = Array.from({ length: 12 }, (_, i) => offer("Assistant commercial en alternance", "69 - LYON 03", (2 + i) * D));
const farFresh = Array.from({ length: 40 }, (_, i) => offer("Vendeur en alternance", "75 - PARIS 11", (1 + (i % 20)) * H));
const all = [...local, ...farFresh];
const scores: Record<string, number> = Object.fromEntries(all.map((o) => [o.id, Math.max(30, Math.min(99, computeMatchScore(profile, o, NOW)))]));
const ranked = [...all].sort((a, b) => scores[b.id] - scores[a.id]);
const far = (o: Offer) => geoMatch(profile, o).points < 0;

// Avant : les nouveautés de Paris prennent toute la tête du paquet.
const before = orderFreshFirst(ranked, scores, 30, NOW);
assert.ok(before.deck.slice(0, 10).every(far));
// Après : seules les nouveautés proches peuvent passer devant.
const after = orderFreshFirst(ranked, scores, 30, NOW, (o) => !far(o));
assert.equal(after.freshPicks.length, 0);
assert.ok(after.deck.slice(0, 10).every((o) => !far(o)));
// Une nouveauté proche passe toujours devant.
const nearFresh = offer("Vendeur en alternance", "69 - LYON 07", 2 * H);
scores[nearFresh.id] = Math.max(30, Math.min(99, computeMatchScore(profile, nearFresh, NOW)));
const withNear = orderFreshFirst([...ranked, nearFresh].sort((a, b) => scores[b.id] - scores[a.id]), scores, 30, NOW, (o) => !far(o));
assert.equal(withNear.deck[0].id, nearFresh.id);

console.log("deck-distance.test.ts OK");
