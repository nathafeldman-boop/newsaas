// Salves horaires (5/11) : 100 emails par heure ; depuis le 6/11 de 12 h à 21 h à Paris ; 400 par heure depuis le 7/11, 4 000 par jour au plus.
// Lancer : npx tsx --tsconfig tsconfig.json tests/salves-horaires.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HOURLY_SALVE_QUEUE,
  HOURLY_SALVE_SIZE,
  HOURLY_SALVES_START,
  inHourlySalves,
  parisHour,
  planHourlySalve,
} from "../src/lib/campaigns/salvesHoraires";
import { CAMPAIGNS } from "../src/lib/campaigns/relanceOffres";

assert.equal(HOURLY_SALVE_SIZE, 400);
assert.equal(parisHour(HOURLY_SALVES_START), 15, "premier passage à 15 h à Paris");
assert.equal(inHourlySalves(HOURLY_SALVES_START - 1), false, "rien avant 15 h le 5/11");
assert.equal(inHourlySalves(Date.parse("2026-11-05T13:00:00Z")), false, "14 h à Paris : trop tôt");
assert.equal(inHourlySalves(Date.parse("2026-11-05T20:00:00Z")), true, "21 h à Paris : dernier passage");
assert.equal(inHourlySalves(Date.parse("2026-11-05T21:00:00Z")), false, "22 h à Paris : fini");
assert.equal(inHourlySalves(Date.parse("2026-11-06T14:00:00Z")), true, "et le lendemain aussi");
assert.equal(inHourlySalves(Date.parse("2026-11-06T09:00:00Z")), false, "pas le matin");
assert.equal(inHourlySalves(Date.parse("2026-11-07T10:00:00Z")), false, "11 h à Paris : pas encore");
assert.equal(inHourlySalves(Date.parse("2026-11-07T11:00:00Z")), true, "12 h à Paris : premier passage depuis le 6/11");
// Heure d'été : 13 h UTC = 15 h à Paris.
assert.equal(inHourlySalves(Date.parse("2027-04-05T13:00:00Z")), true);
assert.equal(inHourlySalves(Date.parse("2027-04-05T20:00:00Z")), false, "22 h à Paris en été");
assert.equal(inHourlySalves(Date.parse("2027-04-05T10:00:00Z")), true, "12 h à Paris en été");

const at = Date.parse("2026-11-05T15:00:00Z");
assert.deepEqual(planHourlySalve(at, 0), { kind: "run", size: 400 });
assert.deepEqual(planHourlySalve(at, 40), { kind: "run", size: 360 }, "complète seulement jusqu'à 400");
assert.deepEqual(planHourlySalve(at, 400), { kind: "skipped", reason: "deja_parti" });
assert.deepEqual(planHourlySalve(Date.parse("2026-11-05T10:00:00Z"), 0), { kind: "skipped", reason: "hors_fenetre" });

// D'abord les nouvelles offres (l'email qui a vendu le 6/11), puis le « Dernier appel ».
assert.deepEqual([...HOURLY_SALVE_QUEUE], ["offres", "dernierappel"]);
assert.ok(HOURLY_SALVE_QUEUE.every((id) => CAMPAIGNS[id]));

// vercel.json : un passage par heure, de 12 h à 21 h à Paris (hiver) : 4 000 emails par jour au plus.
const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync("vercel.json", "utf8")).crons;
const salve = crons.filter((c) => c.path === "/api/cron/salves-horaires");
// Emails arrêtés le 11/11 (Nathan) : cron retiré de vercel.json. L'ancien horaire reste vérifié ci-dessous.
assert.equal(salve.length, 0);
const winterRuns = Array.from({ length: 11 }, (_, i) => Date.parse(`2026-11-07T${String(10 + i).padStart(2, "0")}:00:00Z`));
assert.deepEqual(winterRuns.filter(inHourlySalves).map(parisHour), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21], "10 passages par jour");
assert.equal(winterRuns.filter(inHourlySalves).length * HOURLY_SALVE_SIZE, 4000, "4 000 emails par jour au plus");

console.log("salves-horaires : OK");
