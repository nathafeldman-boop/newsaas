// Objectif du jour (30/10) : reste du mois ÷ jours restants, sinon rythme du défi.
// Lancer : npx tsx --tsconfig tsconfig.json tests/daily-goal.test.ts
import assert from "node:assert/strict";
import { computeDailyGoal, dailyTarget, parisDaysLeft } from "../src/lib/admin/dailyGoal";
import { monthRange } from "../src/lib/admin/cockpit/format";

// Novembre 2026 : 30 jours ; le 1er à 10 h, 30 jours restants ; le 30 au soir, 1.
const nov = monthRange("2026-11", Date.parse("2026-11-15T12:00:00Z")).range;
assert.equal(parisDaysLeft(Date.parse("2026-11-01T09:00:00Z"), nov), 30);
assert.equal(parisDaysLeft(Date.parse("2026-11-30T21:00:00Z"), nov), 1);
// Changement d'heure (25/10) : octobre a bien 31 jours.
const oct = monthRange("2026-10", Date.parse("2026-10-15T12:00:00Z")).range;
assert.equal(parisDaysLeft(Date.parse("2026-10-01T08:00:00Z"), oct), 31);
assert.equal(parisDaysLeft(Date.parse("2026-10-30T08:00:00Z"), oct), 2);

// 3 000 € sur 30 jours → 100 € par jour ; arrondi à l'euro supérieur.
assert.equal(dailyTarget(300_000, 30), 10_000);
assert.equal(dailyTarget(10_001, 3), 3_400);
assert.equal(dailyTarget(0, 5), 0);
assert.equal(dailyTarget(5_000, 0), 0);

const challenge = { totalBeforeTodayCents: 170_000, daysLeft: 365 };
// Objectif du mois : la cible ne bouge pas pendant la journée.
const g = computeDailyGoal({ monthGoalCents: 300_000, monthBeforeTodayCents: 100_000, todayCents: 4_000, todayPayments: 3, daysToGo: 20, challenge });
assert.equal(g.source, "mois");
assert.equal(g.targetCents, 10_000);
assert.equal(g.reached, false);
assert.equal(g.monthDoneCents, 104_000);
assert.equal(computeDailyGoal({ monthGoalCents: 300_000, monthBeforeTodayCents: 100_000, todayCents: 12_000, todayPayments: 9, daysToGo: 20, challenge }).reached, true);

// Mois déjà atteint, ou pas d'objectif : rythme du défi (98 300 € en 365 jours ≈ 270 €).
const done = computeDailyGoal({ monthGoalCents: 130_000, monthBeforeTodayCents: 140_000, todayCents: 0, todayPayments: 0, daysToGo: 2, challenge });
assert.equal(done.source, "defi");
assert.equal(done.targetCents, 27_000);
assert.equal(computeDailyGoal({ monthGoalCents: null, monthBeforeTodayCents: 0, todayCents: 0, todayPayments: 0, daysToGo: 10, challenge }).source, "defi");
// Défi atteint et pas d'objectif : rien à viser.
const none = computeDailyGoal({ monthGoalCents: null, monthBeforeTodayCents: 0, todayCents: 500, todayPayments: 1, daysToGo: 10, challenge: { totalBeforeTodayCents: 10_000_000, daysLeft: 100 } });
assert.equal(none.source, "aucun");
assert.equal(none.targetCents, 0);
assert.equal(none.reached, false);

console.log("daily-goal : OK");
