// Aide aux abonnés (28/10) : candidatures spontanées (codes ROME, zone,
// lettre), résultats du tableau de bord, emails de relance et d'offre fraîche.
// Lancer : npx tsx --tsconfig tsconfig.json tests/abonnes.test.ts
import assert from "node:assert/strict";
import { METIER_ROMES, romesForProfile } from "../src/lib/spontaneous/romes";
import { cityOfAddress, toTarget, zoneFor } from "../src/lib/spontaneous/targets";
import { spontaneousLetter } from "../src/lib/spontaneous/letter";
import { missingForLba } from "../src/lib/spontaneous/send";
import { computeResults } from "../src/lib/subscribers/results";
import { renderFollowUpReminder } from "../src/lib/subscribers/followUps";
import { renderFreshAlert } from "../src/lib/subscribers/freshAlerts";
import { renderOfferAlert } from "../src/lib/alerts/offerAlert";
import { METIERS, classifyMetier } from "../src/lib/seo/metiers";
import type { LbaRecruiter } from "../src/lib/laBonneAlternance/client";
import { interviewDomainFor } from "../src/lib/interview/domainForJob";
import { isStageioInvoice } from "../src/lib/admin/stageioInvoice";

// Codes ROME : chaque métier de la taxonomie en a, au bon format.
for (const m of METIERS) assert.ok(METIER_ROMES[m.slug]?.length, `métier sans code ROME : ${m.slug}`);
for (const codes of Object.values(METIER_ROMES)) for (const c of codes) assert.match(c, /^[A-N]\d{4}$/);
assert.deepEqual(romesForProfile({ target_jobs: ["Commercial"] }), ["D1402", "D1403", "D1407"]);
assert.deepEqual(romesForProfile({ target_jobs: ["Gestionnaire de paie"] }).slice(0, 2), ["M1501", "M1203"]);
assert.deepEqual(romesForProfile({ target_jobs: [] }), []);
assert.ok(romesForProfile({ target_jobs: ["Commercial", "Assistant RH", "Comptable", "Marketing"] }).length <= 6);

// Zone : ville connue → coordonnées et rayon selon la mobilité ; département → code.
const lyon = zoneFor({ city: "Lyon", mobility: "Sur place uniquement" });
assert.ok(lyon && "latitude" in lyon && lyon.radius === 20);
const rhone = zoneFor({ city: "Rhône (69)", mobility: null });
assert.ok(rhone && "departement" in rhone && rhone.departement === "69");
assert.equal(zoneFor({ city: null, mobility: null }), null);

assert.equal(cityOfAddress("12 RUE DE LA PAIX 69003 LYON"), "Lyon");
assert.equal(cityOfAddress("ZI NORD 13127 VITROLLES CEDEX"), "Vitrolles");

const recruiter = (o: Partial<LbaRecruiter["apply"]> & { name?: string }) =>
  ({
    identifier: { id: "x" },
    workplace: { name: o.name ?? "BOULANGERIE MARTIN", brand: null, legal_name: null, description: null, website: null, siret: null, size: "6-9", location: { address: "3 rue X 69001 LYON" }, domain: { naf: { code: "1071C", label: "Boulangerie et boulangerie-pâtisserie" } } },
    apply: { url: "https://x", phone: null, recipient_id: o.recipient_id },
  }) as LbaRecruiter;
assert.equal(toTarget(recruiter({ recipient_id: null })), null, "sans destinataire, pas d'envoi possible");
assert.deepEqual(toTarget(recruiter({ recipient_id: "r1" })), {
  recipientId: "r1", company: "Boulangerie Martin", activity: "Boulangerie et boulangerie-pâtisserie", city: "Lyon", size: "6-9", website: null,
});

// Lettre spontanée : jamais d'« annonce », accords selon le genre, nom en signature.
const base = { full_name: "Léa Martin", target_jobs: ["Vendeuse en boulangerie"], formation: "CAP Boulanger", education_level: null, skills: ["accueil client", "encaissement"], availability_date: null, city: "Lyon" };
const letterF = spontaneousLetter({ ...base, gender: "femme" }, "Boulangerie Martin", "Boulangerie et boulangerie-pâtisserie");
assert.ok(!/annonce|offre/i.test(letterF), letterF);
assert.ok(letterF.includes("Sérieuse, motivée") && letterF.includes("Boulangerie Martin") && letterF.trim().endsWith("Léa Martin"));
assert.ok(letterF.includes("accueil client et encaissement"));
assert.ok(!/Sérieux|Sérieuse/.test(spontaneousLetter({ ...base, gender: "non_precise" }, "X", null)));

assert.deepEqual(missingForLba({ full_name: "Léa", phone: "06 12 34 56 78", cv_path: null }), ["no_cv", "no_name"]);
assert.deepEqual(missingForLba({ full_name: "Léa Martin", phone: "0612345678", cv_path: "u/cv.pdf" }), []);

// Résultats : spontanées comprises, réponses sans double compte, « à envoyer » exclu.
{
  const NOW = Date.parse("2026-10-28T12:00:00Z");
  const iso = (daysAgo: number) => new Date(NOW - daysAgo * 86_400_000).toISOString();
  const r = computeResults({
    now: NOW,
    applications: [
      { status: "envoyee", applied_at: iso(2), sent_at: iso(2) },
      { status: "entretien", applied_at: iso(10), sent_at: iso(10) },
      { status: "refusee", applied_at: iso(3), sent_at: iso(3) },
      { status: "a_preparer", applied_at: iso(1), sent_at: null },
    ],
    spontaneousAt: [iso(1), iso(9)],
    inboundAt: [iso(4), iso(6)],
  });
  assert.equal(r.sentTotal, 5);
  assert.equal(r.sentWeek, 3);
  assert.equal(r.replies, 2);
  assert.equal(r.interviews, 1);
  assert.equal(r.firstReplyAt, iso(6));
}

// Emails : relance, offre fraîche, résumé du matin des abonnés.
const reminder = renderFollowUpReminder({ id: "u1", full_name: "Léa Martin" }, [{ offer: { id: "o1", title: "Vendeuse", company: "Fnac", contract_type: "alternance" } }]);
assert.ok(reminder.subject.includes("Fnac") && reminder.html.includes("/mes-candidatures"));
const fresh = renderFreshAlert({ id: "u1", full_name: "Léa Martin" }, [{ offer: { id: "o1", title: "Vendeuse", company: "Fnac", location: "Lyon", contract_type: "alternance" }, score: 82 }]);
assert.ok(fresh.subject.includes("moins d'1 h") && fresh.html.includes("82 % compatible"));
const match = { offer: { id: "o1", title: "Vendeuse", company: "Fnac", location: "Lyon", contract_type: "alternance" as const }, score: 80 };
const withRecap = renderOfferAlert({ profileId: "u1", firstName: "Léa", matches: [match], frequency: "daily", recap: { sent: 12, replies: 1 } });
assert.ok(withRecap.html.includes("12 candidatures envoyées, 1 réponse reçue") && withRecap.html.includes("/spontanees"));
const noRecap = renderOfferAlert({ profileId: "u1", firstName: "Léa", matches: [match], frequency: "daily" });
assert.ok(!noRecap.html.includes("/spontanees"), "non-abonnés : rien ne change");

// Simulateur : le métier ou l'intitulé de l'offre choisit le bon domaine.
assert.equal(interviewDomainFor("Commercial"), "commerce");
assert.equal(interviewDomainFor("Alternance Commercial(e) sédentaire"), "commerce");
assert.equal(interviewDomainFor("Gestionnaire de paie"), "rh");
assert.equal(interviewDomainFor("Développeur full stack"), "dev");
assert.equal(interviewDomainFor("zzz"), null);
// « sédentaire » contient « dentaire » : plus classé en santé (28/10).
assert.equal(classifyMetier("Commercial sédentaire H/F")?.slug, "commercial");
assert.equal(classifyMetier("Assistant dentaire")?.slug !== "commercial", true);

// Factures Stageio reconnues par le nom du produit (compte Stripe partagé, 28/10).
assert.equal(isStageioInvoice({ lines: { data: [{ description: "1 × Stageio Premium (at €7.99 / month)" }] } }), true);
assert.equal(isStageioInvoice({ lines: { data: [{ description: "stageio ultime" }] } }), true);
assert.equal(isStageioInvoice({ lines: { data: [{ description: "Autre site — abonnement" }] } }), false);
assert.equal(isStageioInvoice({ lines: null }), false);

console.log("abonnes: ok");
