// Suivi des candidatures : statuts, relances, message de relance, rendu des
// tableaux (favoris, candidatures) sur des données fictives.
// Lancer : npx tsx --tsconfig tsconfig.json tests/applications-tracking.test.tsx
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import * as st from "../src/lib/applications/status";
import { followUpMessage } from "../src/lib/applications/followUpMessage";
import { buildActionPlan } from "../src/lib/dashboard/actionPlan";
import { ApplicationsBoard, type TrackedApplication } from "../src/components/candidature/ApplicationsBoard";
import { FavoritesBoard, type FavoriteItem } from "../src/components/offers/FavoritesBoard";
import type { Offer } from "../src/types/database";

const D = 86_400_000;
const NOW = Date.UTC(2026, 9, 24, 17);
const iso = (t: number) => new Date(t).toISOString();

// Tous les statuts ont un libellé, un groupe, une aide.
for (const s of st.STATUS_ORDER) {
  assert.ok(st.STATUS_LABELS[s] && st.STATUS_HINTS[s], s);
  assert.ok(st.STATUS_GROUPS.some((g) => g.statuses.includes(s)), `groupe ${s}`);
}
assert.equal(st.statusGroup("a_preparer"), "todo");
assert.equal(st.statusGroup("en_cours"), "waiting");
assert.equal(st.statusGroup("cloturee"), "done");
assert.equal(st.isSentStatus("a_preparer"), false);
assert.equal(st.isSentStatus("refusee"), true);
assert.ok(st.isTerminalStatus("cloturee") && !st.isTerminalStatus("entretien"));

// Relance : 7 jours après l'envoi, sinon après l'ajout ; date choisie prioritaire ; rien hors attente.
const base = { applied_at: iso(NOW - 10 * D) };
assert.equal(st.followUpAt({ ...base, status: "envoyee" }), NOW - 3 * D);
assert.equal(st.followUpAt({ ...base, status: "envoyee", sent_at: iso(NOW - 2 * D) }), NOW + 5 * D);
assert.equal(st.followUpAt({ ...base, status: "en_cours", follow_up_at: iso(NOW + D) }), NOW + D);
assert.equal(st.followUpAt({ ...base, status: "a_preparer" }), null);
assert.equal(st.followUpAt({ ...base, status: "entretien" }), null);
assert.equal(st.isFollowUpDue({ ...base, status: "envoyee" }, NOW), true);
assert.equal(st.isFollowUpDue({ ...base, status: "envoyee", sent_at: iso(NOW - 2 * D) }, NOW), false);

// Erreurs Postgres / PostgREST reconnues pour le repli.
assert.ok(st.isInvalidEnumError({ code: "22P02" }));
assert.ok(st.isMissingColumnError({ code: "PGRST204", message: "Could not find the 'note' column of 'applications' in the schema cache" }));
assert.ok(st.isMissingColumnError({ code: "42703", message: 'column applications.follow_up_at does not exist' }));
assert.ok(!st.isMissingColumnError({ code: "23505", message: "duplicate key" }));

// Message de relance : rempli, sans invention, nom par défaut.
const msg = followUpMessage({ title: "Assistant RH", company: "Acme", contractType: "alternance", sentAt: "2026-10-14T09:00:00Z", fullName: null });
assert.match(msg.subject, /alternance – Assistant RH/);
assert.match(msg.body, /chez Acme, envoyée le 14 octobre/);
assert.match(msg.body, /\[Ton prénom et ton nom\]$/);

// Plan d'action : entretiens et relances.
const plan = buildActionPlan({ newMatchingOffersCount: 0, offersToApplyCount: 0, staleApplicationsCount: 2, interviewsCount: 1 });
assert.equal(plan.length, 2);
assert.match(plan[0].text, /2 candidatures à relancer/);
assert.match(plan[1].text, /1 entretien en vue/);

// Rendu du tableau de suivi.
const offer = (id: string, o: Partial<Offer> = {}): Offer => ({
  id, title: `Poste ${id}`, company: `Entreprise ${id}`, location: "Lyon (69)", contract_type: "alternance", sector: null, description: "",
  requirements: null, duration: null, salary: null, remote_policy: null, start_date: null, education_level: null, image_url: null,
  apply_url: "https://example.org", source: "france_travail", source_url: null, external_id: null, is_active: true,
  published_at: iso(NOW - 2 * D), created_at: iso(NOW - 2 * D), last_seen_at: iso(NOW), content_fingerprint: null, quality_score: 50, ...o,
} as Offer);
const tracked = (id: string, status: TrackedApplication["status"], o: Partial<TrackedApplication> = {}): TrackedApplication => ({
  id, offerId: `o${id}`, status, appliedAt: iso(NOW - 10 * D), sentAt: null, followUpAt: null, dueAt: null, note: null,
  offer: { title: `Poste ${id}`, company: `Entreprise ${id}`, location: "Lyon", contractType: "alternance", isActive: true, applyUrl: null },
  history: [{ label: "Ajoutée au suivi", at: iso(NOW - 10 * D) }], ...o,
});
const items = [
  tracked("1", "a_preparer"),
  tracked("2", "envoyee", { dueAt: NOW - 3 * D }),
  tracked("3", "entretien"),
  tracked("4", "refusee", { offer: { title: "Poste 4", company: "Vieille", location: "Paris", contractType: "stage", isActive: false, applyUrl: null } }),
  tracked("5", "a_preparer", { offer: { title: "Poste 5", company: "Partie", location: "Nice", contractType: "stage", isActive: false, applyUrl: null } }),
];
const html = renderToString(<ApplicationsBoard items={items} now={NOW} trackingReady={true} fullName="Léa Martin" />).replace(/<!-- -->/g, "");
assert.match(html, /À faire maintenant/);
assert.match(html, /Relance Entreprise 2 : candidature envoyée il y a 10 jours/);
assert.match(html, /Entretien chez Entreprise 3/);
assert.match(html, /Ta lettre pour Entreprise 1 est prête/);
assert.match(html, /L&#x27;offre de Partie n&#x27;est plus en ligne/);
assert.match(html, /Offre plus en ligne/);
assert.match(html, /relance à faire/);
// Ordre : relance, entretien, à envoyer, offre partie.
assert.ok(html.indexOf("Relance Entreprise 2") < html.indexOf("Entretien chez") && html.indexOf("Entretien chez") < html.indexOf("Ta lettre pour"));

// Rendu des favoris : offres en ligne d'abord, expirées à part.
const favs: FavoriteItem[] = [
  { offer: offer("a"), likedAt: iso(NOW - D), status: null, matchScore: 80 },
  { offer: offer("b", { contract_type: "stage", location: "Paris" }), likedAt: iso(NOW - 2 * D), status: "envoyee", matchScore: 60 },
  { offer: offer("c", { is_active: false }), likedAt: iso(NOW - 3 * D), status: null, matchScore: null },
];
const favHtml = renderToString(<FavoritesBoard items={favs} />).replace(/<!-- -->/g, "");
assert.match(favHtml, /3 favoris/);
assert.match(favHtml, /1 sans candidature/);
assert.match(favHtml, /Afficher les offres plus en ligne \(1\)/);
assert.match(favHtml, /Lyon \(2\)/);
assert.ok(!favHtml.includes("Poste c"), "offre expirée repliée par défaut");

console.log("applications-tracking: OK");
