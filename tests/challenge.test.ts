// Défi d'un an (29/10) : 100 000 € d'ici le 29/10/2027.
// Lancer : npx tsx --tsconfig tsconfig.json tests/challenge.test.ts
import assert from "node:assert/strict";
import { CHALLENGE, challengeState, countdownParts } from "../src/lib/admin/challenge";

const D = 86_400_000;

// Fin : minuit à Paris le 29/10/2027 au soir, un an après le départ.
assert.equal(new Date(CHALLENGE.end).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }), "30/10/2027 00:00:00");
assert.ok(CHALLENGE.end - CHALLENGE.start > 364 * D && CHALLENGE.end - CHALLENGE.start < 366 * D);

// Au départ : 1 700 € déjà encaissés, 1 200 € sur les 30 derniers jours.
const s = challengeState({ now: CHALLENGE.start, totalCents: 170_000, last30Cents: 120_000 });
assert.equal(s.reached, false);
assert.equal(s.remainingCents, 9_830_000);
assert.ok(Math.abs(s.daysLeft - 365.25) < 0.01);
assert.ok(s.neededPerDayCents! > 26_900 && s.neededPerDayCents! < 27_000); // ≈ 269 € par jour
assert.equal(s.neededPerMonthCents, Math.round((9_830_000 / s.daysLeft) * 30));
assert.equal(s.pacePerDayCents, 4_000);
assert.equal(s.projectedCents, Math.round(170_000 + 4_000 * s.daysLeft));
assert.equal(s.timeShare, 0);
assert.equal(s.moneyShare, 0.017);

// Objectif atteint, puis temps écoulé.
assert.equal(challengeState({ now: CHALLENGE.start + 100 * D, totalCents: 10_000_000, last30Cents: 0 }).reached, true);
const over = challengeState({ now: CHALLENGE.end + D, totalCents: 5_000_000, last30Cents: 0 });
assert.equal(over.over, true);
assert.equal(over.neededPerDayCents, null);
assert.equal(over.timeShare, 1);

// Découpage du minuteur.
assert.deepEqual(countdownParts(2 * D + 3 * 3_600_000 + 4 * 60_000 + 5_500), { days: 2, hours: 3, minutes: 4, seconds: 5 });
assert.deepEqual(countdownParts(-1), { days: 0, hours: 0, minutes: 0, seconds: 0 });

console.log("challenge : OK");
