// Alerte e-mail « nouvelles offres » : échéances, fenêtre, contenu échappé.
// Lancer : npx tsx --tsconfig tsconfig.json tests/offer-alert.test.ts
import assert from "node:assert/strict";
import { alertFrequency, escapeHtml, isDue, renderOfferAlert, windowStart } from "../src/lib/alerts/offerAlert";

const H = 3600_000;
const NOW = Date.UTC(2026, 9, 25, 6, 0);
const iso = (t: number) => new Date(t).toISOString();

assert.equal(alertFrequency("weekly"), "weekly");
assert.equal(alertFrequency(undefined), "daily");
assert.equal(alertFrequency("n'importe quoi"), "daily");

// Quotidien : dû après 20 h ; un 2e passage le même matin ne renvoie rien.
assert.equal(isDue(null, "daily", NOW), true);
assert.equal(isDue(iso(NOW - 24 * H), "daily", NOW), true);
assert.equal(isDue(iso(NOW - 30 * 60_000), "daily", NOW), false);
// Hebdomadaire : dû après 7 jours (2 h de marge).
assert.equal(isDue(iso(NOW - 3 * 24 * H), "weekly", NOW), false);
assert.equal(isDue(iso(NOW - 7 * 24 * H + H), "weekly", NOW), true);

// Fenêtre : depuis le dernier passage, 24 h la première fois, 8 jours au plus.
assert.equal(windowStart(null, NOW), iso(NOW - 24 * H));
assert.equal(windowStart(iso(NOW - 26 * H), NOW), iso(NOW - 26 * H));
assert.equal(windowStart(iso(NOW - 40 * 24 * H), NOW), iso(NOW - 8 * 24 * H));

assert.equal(escapeHtml(`<b>"R&D"</b>`), "&lt;b&gt;&quot;R&amp;D&quot;&lt;/b&gt;");
const mail = renderOfferAlert({
  profileId: "p1",
  firstName: "Léa<script>",
  frequency: "weekly",
  matches: [
    { offer: { id: "11111111-1111-1111-1111-111111111111", title: "Assistant <RH>", company: "A&B", location: "Lyon (69)", contract_type: "alternance" }, score: 82 },
    { offer: { id: "22222222-2222-2222-2222-222222222222", title: "Vendeur", company: "Shop", location: "Paris", contract_type: "stage" }, score: 64 },
  ],
});
assert.equal(mail.subject, "2 nouvelles offres pour toi cette semaine 👀");
assert.ok(!mail.html.includes("<script>") && !mail.html.includes("<RH>"));
assert.match(mail.html, /Assistant &lt;RH&gt;/);
assert.match(mail.html, /A&amp;B/);
assert.match(mail.html, /utm_medium=alerte/);
assert.match(mail.html, /une fois par semaine/);
assert.match(mail.html, /api\/unsubscribe\?u=p1/);
assert.match(mail.text, /Vendeur — Shop \(Paris\), 64 % compatible/);
assert.equal(renderOfferAlert({ profileId: "p", firstName: null, frequency: "daily", matches: [mail ? { offer: { id: "x", title: "T", company: "C", location: "L", contract_type: "stage" }, score: 70 } : (null as never)] }).subject, "1 nouvelle offre pour toi depuis hier 👀");

console.log("offer-alert: OK");
