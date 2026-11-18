// Espace créateurs : tarifs, boucle de validation, gains par période, carrousel (18/11).
// Lancer : npx tsx --tsconfig tsconfig.json tests/espace-createurs.test.ts [page-tiktok.html]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dailySeries, earningsEur, gainedByVideo, needsReview, periodTotals, rpmOf } from "../src/lib/creators/earnings";
import { detectKind } from "../src/lib/creators/tiktokViews";
import { hashToken, inviteCode, isValidInvite, newAccessToken } from "../src/lib/creators/access";

process.env.PAYMENT_LINK_SECRET = "test-secret";

assert.equal(rpmOf({ kind: "carousel", declared_face: null, approved_face: null }), 0.5);
assert.equal(rpmOf({ kind: "video", declared_face: "face", approved_face: null }), 1.5);
assert.equal(rpmOf({ kind: "video", declared_face: "face", approved_face: "faceless" }), 1);
assert.equal(rpmOf({ kind: "video", declared_face: null, approved_face: null }), 1);
assert.equal(rpmOf({ kind: null, declared_face: null, approved_face: null }), 0.5);
assert.equal(earningsEur(12_000, 1.5), 18);
assert.deepEqual([1, 2, 3, 4, 5, 6, 10, 11, 15].map(needsReview), [true, false, false, false, true, false, true, false, true]);

const t = (iso: string) => Date.parse(iso);
const videos = [
  { id: "a", kind: "video" as const, declared_face: "face" as const, approved_face: null, views: 3000 },
  { id: "b", kind: "carousel" as const, declared_face: null, approved_face: null, views: 10_000 },
];
const snaps = [
  { video_id: "a", checked_at: "2026-11-10T10:00:00Z", views: 1000 },
  { video_id: "a", checked_at: "2026-11-17T10:00:00Z", views: 3000 },
  { video_id: "b", checked_at: "2026-11-16T10:00:00Z", views: 10_000 },
];
const range = { start: t("2026-11-15T00:00:00Z"), end: t("2026-11-18T00:00:00Z") };
assert.deepEqual([...gainedByVideo(snaps, range)], [["a", 2000], ["b", 10_000]]);
const p = periodTotals(videos, snaps, range);
assert.equal(p.views, 12_000);
assert.equal(Math.round(p.eur * 100), 300 + 500); // 2 000 × 1,50 + 10 000 × 0,50
const d = dailySeries(videos, snaps, 3, t("2026-11-17T12:00:00Z"));
assert.equal(d.times.length, 3);
assert.equal(d.views.reduce((a, b) => a + b, 0), 12_000);

assert.equal(detectKind('..."imagePost":{"images":[{"x":1}]...', "https://www.tiktok.com/@a/video/1"), "carousel");
assert.equal(detectKind("<html>playCount</html>", "https://www.tiktok.com/@a/photo/7311111111"), "carousel");
assert.equal(detectKind("<html></html>", "https://www.tiktok.com/@a/video/7311111111"), "video");
if (process.argv[2]) assert.equal(detectKind(readFileSync(process.argv[2], "utf8"), "https://www.tiktok.com/@x/video/1"), "carousel", "vrai carrousel Stageio");

assert.ok(isValidInvite(inviteCode()));
assert.equal(isValidInvite("faux"), false);
const tok = newAccessToken();
assert.equal(hashToken(tok.token), tok.hash);
assert.notEqual(newAccessToken().token, tok.token);
console.log("espace créateurs : OK");
