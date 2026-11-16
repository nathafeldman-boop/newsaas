// Vues des TikTok des créateurs et RPM de la vue d'ensemble (16/11).
// Lancer : npx tsx --tsconfig tsconfig.json tests/createurs-tiktok.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractPlayCount, parseTikTokList, parseTikTokUrl, rpmEuros, viewsGainedIn } from "../src/lib/creators/tiktokViews";

assert.deepEqual(parseTikTokUrl("https://www.tiktok.com/@Lea.job/video/7311111111111111111?is_from_webapp=1&sender_device=pc"), {
  url: "https://www.tiktok.com/@Lea.job/video/7311111111111111111",
  creator: "lea.job",
});
assert.deepEqual(parseTikTokUrl("vm.tiktok.com/ZMabc123/"), { url: "https://vm.tiktok.com/ZMabc123", creator: null });
assert.deepEqual(parseTikTokUrl("https://www.tiktok.com/t/ZT8xyz/"), { url: "https://www.tiktok.com/t/ZT8xyz", creator: null });
assert.equal(parseTikTokUrl("https://www.instagram.com/reel/abc"), null);
assert.equal(parseTikTokUrl("https://www.tiktok.com/@lea"), null);
assert.equal(parseTikTokUrl("https://evil-tiktok.com/@a/video/7311111111111111111"), null);

const list = parseTikTokList(
  "https://www.tiktok.com/@a/video/7311111111111111111\nhttps://www.tiktok.com/@a/video/7311111111111111111?x=1, n'importe quoi",
);
assert.equal(list.valid.length, 1, "doublon retiré");
assert.deepEqual(list.invalid, ["n'importe", "quoi"]);

assert.equal(extractPlayCount('{"stats":{"diggCount":98900,"playCount":594900},"statsV2":{"playCount":"595012"}}'), 595012);
assert.equal(extractPlayCount("<html>rien</html>"), null);

const h = 3600_000;
const t0 = Date.parse("2026-11-16T00:00:00Z");
const at = (k: number) => new Date(t0 + k * h).toISOString();
const snaps = [
  { video_id: "a", checked_at: at(1), views: 0 },
  { video_id: "a", checked_at: at(4), views: 5000 },
  { video_id: "a", checked_at: at(7), views: 8000 },
  { video_id: "b", checked_at: at(5), views: 2000 },
];
// Période 3 h → 8 h : a passe de 0 à 8000, b relevée pour la 1re fois (2000).
assert.equal(viewsGainedIn(snaps, { start: t0 + 3 * h, end: t0 + 8 * h }), 10_000);
// Période 4 h → 6 h : a gagne 0 (5000 à 4 h, 5000 à 6 h), b 2000.
assert.equal(viewsGainedIn(snaps, { start: t0 + 4 * h, end: t0 + 6 * h }), 2000);
assert.equal(viewsGainedIn([], { start: 0, end: t0 }), 0);

assert.equal(rpmEuros(2000, 5000), 4); // 20 € pour 5 000 vues = 4 €/1000
assert.equal(rpmEuros(2000, 0), null);

const cron = JSON.parse(readFileSync("vercel.json", "utf8")).crons.find((c: { path: string }) => c.path === "/api/cron/tiktok-views");
assert.equal(cron?.schedule, "25 */3 * * *", "relevé toutes les 3 h");

console.log("createurs-tiktok : OK");
