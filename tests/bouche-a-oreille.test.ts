// « Ta semaine » et partage des victoires (29/10).
// Lancer : npx tsx --tsconfig tsconfig.json tests/bouche-a-oreille.test.ts
import assert from "node:assert/strict";
import { isMondayInParis, renderWeeklyPlan, weekKey, weeklyFocus, WEEKLY_TARGET } from "../src/lib/subscribers/weeklyPlan";
import { contractOf, inviterFirstName, referralUrl, shareMessage, SIGNED_VIA_STAGEIO } from "../src/lib/referrals/share";
import { renderSignedEmail } from "../src/lib/referrals/signedEmail";

const r = (o: Partial<{ sentWeek: number; sentTotal: number; replies: number; interviews: number }>) => ({ sentWeek: 0, sentTotal: 0, replies: 0, interviews: 0, ...o });
const base = { hasCv: true, daysSincePaid: 5, auto: false };

// Priorité : entretien > CV > envois sans réponse > volume > réponses > rythme.
assert.equal(weeklyFocus({ ...base, results: r({ interviews: 1, sentWeek: 0 }), hasCv: false }).key, "entretien");
assert.equal(weeklyFocus({ ...base, results: r({}), hasCv: false }).key, "cv");
assert.equal(weeklyFocus({ ...base, results: r({ sentTotal: 20, sentWeek: 2 }), daysSincePaid: 12 }).key, "ciblage");
assert.equal(weeklyFocus({ ...base, results: r({ sentTotal: 20, sentWeek: 2 }), daysSincePaid: 6 }).key, "volume");
assert.equal(weeklyFocus({ ...base, results: r({ sentWeek: 12, sentTotal: 12, replies: 2 }) }).key, "reponses");
assert.equal(weeklyFocus({ ...base, results: r({ sentWeek: 12, sentTotal: 12 }) }).key, "rythme");
assert.match(weeklyFocus({ ...base, results: r({}), auto: true }).text, /chaque like envoie ta candidature/);
assert.equal(WEEKLY_TARGET, 10);

// Semaine : lundi (heure de Paris), même clé toute la semaine.
const mon = Date.parse("2026-11-02T07:15:00Z"); // lundi 8 h 15 à Paris
assert.equal(isMondayInParis(mon), true);
assert.equal(isMondayInParis(Date.parse("2026-11-01T22:30:00Z")), false); // dimanche 23 h 30
assert.equal(weekKey(mon), "2026-11-02");
assert.equal(weekKey(Date.parse("2026-11-08T21:00:00Z")), "2026-11-02"); // dimanche 22 h
assert.equal(weekKey(Date.parse("2026-11-08T23:30:00Z")), "2026-11-09"); // lundi 0 h 30

// Email du lundi.
const focus = weeklyFocus({ ...base, results: r({ sentWeek: 3, sentTotal: 3 }) });
const mail = renderWeeklyPlan({ id: "u1", full_name: "Léa Martin" }, r({ sentWeek: 3, replies: 1 }), focus, [{ id: "o1", title: "Assistant RH", company: "Acme & Co", location: "Lyon" }]);
assert.equal(mail.subject, "Léa, ton point du lundi : 3 candidatures la semaine dernière");
assert.match(mail.html, /10 candidatures cette semaine/);
assert.match(mail.html, /\/candidature\/o1\?utm_source=email&amp;|\/candidature\/o1\?utm_source=email&/);
assert.match(mail.html, /Acme &amp; Co/);
assert.match(mail.html, /Ne plus recevoir ces emails/);
assert.equal(renderWeeklyPlan({ id: "u1", full_name: null }, r({ sentWeek: 1 }), focus, []).subject, "Ton point du lundi : 1 candidature la semaine dernière");
// Ancre conservée après les paramètres de suivi.
const prep = renderWeeklyPlan({ id: "u1", full_name: null }, r({ interviews: 1 }), weeklyFocus({ ...base, results: r({ interviews: 1 }) }), []);
assert.match(prep.html, /\/dashboard\?utm_source=email[^"]*#simulateur/);

// Partage.
const url = referralUrl("LEA42");
assert.equal(url, "https://www.stageio.fr/inscription?ref=LEA42&utm_source=parrainage");
assert.match(shareMessage("signe", url), /^J'ai trouvé mon alternance grâce à Stageio/);
assert.match(shareMessage("entretien", url, "stage"), /entretien pour mon stage/);
assert.equal(contractOf(["stage"]), "stage");
assert.equal(contractOf(["stage", "alternance"]), "alternance");
assert.equal(contractOf([]), "alternance");
assert.equal(inviterFirstName("léa martin"), "Léa");
assert.equal(inviterFirstName("  "), null);
assert.equal(SIGNED_VIA_STAGEIO, "Alternance trouvée via Stageio");

// Félicitations : étapes, message de partage, résiliation rappelée seulement en mensuel.
const signed = renderSignedEmail({ id: "u1", full_name: "Léa Martin", looking_for: ["alternance"], referral_code: "LEA42", subscription_status: "active" });
assert.equal(signed.subject, "Bravo Léa ! 🎉 Ton alternance est trouvée");
assert.match(signed.html, /CERFA/);
assert.match(signed.html, /wa\.me/);
assert.match(signed.html, /2 clics depuis ton Profil/);
const life = renderSignedEmail({ id: "u1", full_name: null, looking_for: ["stage"], referral_code: "LEA42", subscription_status: "lifetime" });
assert.equal(life.subject, "Bravo ! 🎉 Ton stage est trouvé");
assert.doesNotMatch(life.html, /résilies|2 clics/);
assert.match(life.html, /convention de stage/);

console.log("bouche-a-oreille : OK");
