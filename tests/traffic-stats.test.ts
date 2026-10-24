// Trafic et inscriptions de l'admin : sources, jours de Paris, rapprochement
// visiteurs / inscrits / payeurs, tendance jour par jour.
// Lancer : npx tsx --tsconfig tsconfig.json tests/traffic-stats.test.ts
import assert from "node:assert/strict";
import {
  SIGNUPS_SINCE,
  aggregateSignups,
  dayKey,
  daysBetween,
  mergeBySource,
  signupTrend,
  sourceInfo,
  summarizeTrend,
  totalsByGroup,
  weeklyTotals,
  type SignupDay,
} from "../src/lib/admin/trafficStats";

// Sources : alias et casse fusionnés, inconnues rangées dans « Autres ».
assert.deepEqual(sourceInfo("TikTok"), { label: "TikTok", group: "Réseaux sociaux" });
assert.equal(sourceInfo("ig").label, "Instagram");
assert.equal(sourceInfo(" Insta ").label, "Instagram");
assert.equal(sourceInfo("email").group, "E-mails Stageio");
assert.equal(sourceInfo(null).label, "Direct / inconnu");
assert.equal(sourceInfo("").group, "Direct / inconnu");
assert.equal(sourceInfo("chatgpt").group, "Assistants IA");
assert.deepEqual(sourceInfo("ines"), { label: "ines", group: "Autres" });

// Jours de Paris : le 4 septembre commence à 22 h UTC la veille (UTC+2).
assert.equal(dayKey(SIGNUPS_SINCE), "2026-09-04");
assert.equal(dayKey(SIGNUPS_SINCE - 1), "2026-09-03");
// Passage à l'heure d'hiver (25/10) : chaque jour une seule fois, aucun saut.
const autumn = daysBetween(Date.parse("2026-10-23T22:00:00Z"), Date.parse("2026-10-27T10:00:00Z")).map((d) => d.key);
assert.deepEqual(autumn, ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]);
const fromStart = daysBetween(SIGNUPS_SINCE, Date.parse("2026-10-24T09:00:00Z"));
assert.equal(fromStart[0].key, "2026-09-04");
assert.equal(fromStart[fromStart.length - 1].key, "2026-10-24");
assert.equal(fromStart.length, 51);

// Inscrits par jour : 23 h 30 à Paris le 04/09 reste le 04/09.
const days = aggregateSignups([
  { created_at: "2026-09-04T21:30:00Z", utm_source: "tiktok", onboarding_completed: true },
  { created_at: "2026-09-04T08:00:00Z", utm_source: "TikTok", onboarding_completed: false },
  { created_at: "2026-09-04T22:30:00Z", utm_source: null, onboarding_completed: true },
  { created_at: "2026-09-06T10:00:00Z", utm_source: "ig", onboarding_completed: true },
]);
assert.deepEqual(
  days.map((d) => [d.day, d.signups, d.onboarded]),
  [
    ["2026-09-04", 2, 1],
    ["2026-09-05", 1, 1],
    ["2026-09-06", 1, 1],
  ],
);
assert.deepEqual(days[0].sources, { tiktok: 2 });

// Rapprochement : « ig » et « instagram » ne font qu'une ligne ; inscrits et
// payeurs hors période ignorés ; payeurs inconnus (Stripe indisponible) = null.
const period = new Set(["2026-09-06"]);
const rows = mergeBySource(
  [
    { source: "instagram", visitors: 40, signupPageVisitors: 10 },
    { source: "IG", visitors: 5, signupPageVisitors: 1 },
    { source: "email", visitors: 12, signupPageVisitors: 0 },
    { source: "direct", visitors: 30, signupPageVisitors: 4 },
  ],
  days,
  [
    { day: "2026-09-06", source: "ig" },
    { day: "2026-09-04", source: "tiktok" },
  ],
  period,
);
assert.deepEqual(rows[0], { label: "Instagram", group: "Réseaux sociaux", visitors: 45, signupPage: 11, signups: 1, payers: 1 });
assert.equal(rows.find((r) => r.label === "TikTok"), undefined);
assert.equal(rows.find((r) => r.label === "E-mails Stageio")?.payers, 0);
assert.equal(mergeBySource(null, days, null, period)[0].payers, null);
const groups = totalsByGroup(rows);
assert.equal(groups[0].group, "Réseaux sociaux");
assert.equal(groups.reduce((s, g) => s + g.visitors, 0), 87);

// Tendance : jours sans inscrit à 0, écart avec la veille, moyenne 7 j,
// cumul, record (le plus récent en cas d'égalité), jour le plus bas hors
// journée en cours, 7 derniers jours terminés vs 7 d'avant.
const trendDays = daysBetween(SIGNUPS_SINCE, Date.parse("2026-09-18T10:00:00Z"));
const counts = [3, 5, 0, 8, 2, 2, 4, 6, 8, 1, 7, 3, 2, 5, 1];
const signupDays: SignupDay[] = trendDays.map((d, i) => ({ day: d.key, signups: counts[i], onboarded: Math.floor(counts[i] / 2), sources: (counts[i] ? { tiktok: counts[i] } : {}) as Record<string, number> }));
const trend = signupTrend(trendDays, signupDays.filter((d) => d.signups > 0), "2026-09-18");
assert.equal(trend.length, 15);
assert.equal(trend[2].signups, 0);
assert.equal(trend[2].topSource, null);
assert.equal(trend[1].diff, 2);
assert.equal(trend[0].diff, null);
assert.equal(trend[5].avg7, null);
assert.equal(trend[6].avg7, (3 + 5 + 0 + 8 + 2 + 2 + 4) / 7);
assert.equal(trend[14].cumul, counts.reduce((s, n) => s + n, 0));
assert.equal(trend[0].weekday, 5); // vendredi 4 septembre
assert.equal(trend[14].isToday, true);
const summary = summarizeTrend(trend);
assert.equal(summary.total, 57);
assert.equal(summary.today, 1);
assert.equal(summary.yesterday, 5);
assert.equal(summary.record?.key, "2026-09-12"); // 8 le 07/09 et le 12/09 : le plus récent
assert.equal(summary.low?.key, "2026-09-06");
assert.equal(summary.avgPerDay, 56 / 14);
assert.equal(summary.last7, 6 + 8 + 1 + 7 + 3 + 2 + 5);
assert.equal(summary.prev7, 3 + 5 + 0 + 8 + 2 + 2 + 4);
assert.equal(summary.weekdayAvg[5], (3 + 6) / 2); // vendredis 04/09 et 11/09

// Semaines du lundi au dimanche : 04-06/09 (3 j), 07-13/09, 14-18/09 (5 j,
// en cours : « par jour » sur les 4 jours terminés).
assert.deepEqual(
  weeklyTotals(trend).map((w) => [w.start, w.end, w.signups, w.days, w.current, w.perDay]),
  [
    ["2026-09-04", "2026-09-06", 8, 3, false, 8 / 3],
    ["2026-09-07", "2026-09-13", 31, 7, false, 31 / 7],
    ["2026-09-14", "2026-09-18", 18, 5, true, 17 / 4],
  ],
);
// Journée en cours : pas de moyenne 7 j (elle tirerait la tendance vers le bas).
assert.equal(trend[14].avg7, null);
assert.equal(trend[13].avg7, (6 + 8 + 1 + 7 + 3 + 2 + 5) / 7);

console.log("traffic-stats : OK");
