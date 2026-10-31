// Stageio Auto, pause de sécurité (31/10) : 25 envois automatiques en moins de 4 h, fenêtre glissante.
// Lancer : npx tsx --tsconfig tsconfig.json tests/auto-rythme.test.ts
import assert from "node:assert/strict";
import { AUTO_PACE_LIMIT, AUTO_PACE_WINDOW_MS, autoPace, resumeLabel } from "../src/lib/applications/autoSend";
import { AUTO_DAILY_LIMIT } from "../src/lib/pricing/plans";

const MIN = 60_000;
const H = 60 * MIN;
const now = Date.UTC(2026, 9, 31, 14, 0); // 15 h 00 à Paris (heure d'hiver, UTC+1)
const burst = (count: number, startAgo: number, spreadMs: number) =>
  Array.from({ length: count }, (_, i) => now - startAgo + (count > 1 ? (i * spreadMs) / (count - 1) : 0));

assert.equal(AUTO_PACE_LIMIT, 25);
assert.equal(AUTO_PACE_WINDOW_MS, 4 * H);
assert.equal(AUTO_DAILY_LIMIT, 100, "les 100 par jour ne changent pas");

// Moins de 25 envois : jamais de pause.
assert.equal(autoPace([], now), null);
assert.equal(autoPace(burst(24, 10 * MIN, 8 * MIN), now), null);

// 25 envois en 20 minutes : pause jusqu'à 4 h après le plus ancien des 25.
const quick = burst(25, 30 * MIN, 20 * MIN);
assert.equal(autoPace(quick, now), quick[0] + 4 * H);
assert.equal(autoPace([...quick].reverse(), now), quick[0] + 4 * H, "l'ordre des dates n'a pas d'importance");

// 25 envois étalés sur plus de 4 heures : pas de stop (le plus ancien est déjà sorti de la fenêtre).
const slow = [...burst(23, 3 * H + 50 * MIN, 3 * H), now - 5 * MIN, now - 4 * H - MIN]; // 24 dans la fenêtre, 1 en dehors
assert.equal(autoPace(slow, now), null);
const spread = Array.from({ length: 25 }, (_, i) => now - (i * 4 * H) / 24 - MIN);
assert.equal(spread.filter((t) => t > now - 4 * H).length, 24, "garde-fou du test : 24 envois dans la fenêtre, le 25e est sorti");
assert.equal(autoPace(spread, now), null, "25 envois étalés sur 4 h ou plus : aucune pause");

// Un envoi exactement 4 h plus tôt est déjà sorti de la fenêtre.
assert.equal(autoPace([...burst(24, 10 * MIN, 5 * MIN), now - 4 * H], now), null);
// Avec plus de 25 envois, la reprise suit le 25e plus récent (la pause se termine quand il n'en reste plus que 24).
const many = burst(30, 3 * H, 2 * H);
const sortedDesc = [...many].sort((a, b) => b - a);
assert.equal(autoPace(many, now), sortedDesc[24] + 4 * H);
// Envois du futur (horloge décalée) ignorés.
assert.equal(autoPace([...burst(24, 10 * MIN, 5 * MIN), now + H], now), null);

// Le 25e envoi qui vient de partir déclenche l'arrêt tout de suite : 24 déjà là + l'envoi en cours.
const before = burst(24, 40 * MIN, 30 * MIN);
assert.equal(autoPace(before, now), null);
assert.equal(autoPace([...before, now], now), before[0] + 4 * H);

// Libellé de reprise : heure de Paris, « demain » après minuit.
assert.equal(resumeLabel(Date.UTC(2026, 9, 31, 17, 30), now), "18 h 30");
assert.equal(resumeLabel(Date.UTC(2026, 9, 31, 18, 0), now), "19 h");
assert.equal(resumeLabel(Date.UTC(2026, 9, 31, 23, 5), now), "demain à 0 h 05");
assert.equal(resumeLabel(Date.UTC(2026, 9, 31, 22, 0), now), "23 h");

console.log("auto-rythme : OK");
