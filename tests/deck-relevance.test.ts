// Pertinence du paquet d'offres (25/10, Nathan : « personne ne like, les
// offres ne sont pas assez pertinentes ») : chaque défaut repéré devient un
// cas vérifié ici.
// Lancer : npx tsx --tsconfig tsconfig.json tests/deck-relevance.test.ts
import assert from "node:assert/strict";
import { computeMatchScore, computeMatchReasons, geoMatch, profileDepartement, educationGapPenalty } from "../src/lib/matching/score";
import { dedupeOffers, diversifyByCompany, preferTargetJobs, targetJobTitlePatterns } from "../src/lib/matching/deck";
import { cardsToDrop, learnFromPassReasons, type OfferTags } from "../src/lib/matching/passReasons";
import type { Offer, Profile } from "../src/types/database";

const NOW = Date.parse("2026-10-25T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

const profile = (over: Partial<Profile> = {}): Profile =>
  ({
    city: "Lyon",
    mobility: "Sur place uniquement",
    looking_for: ["alternance"],
    sectors: ["Commerce"],
    target_jobs: ["Commercial"],
    skills: [],
    education_level: "Bac+3",
    availability_date: null,
    ...over,
  }) as Profile;

let n = 0;
const offer = (over: Partial<Offer> = {}): Offer =>
  ({
    id: `o${++n}`,
    title: "Commercial terrain (H/F)",
    company: `Entreprise ${n}`,
    location: "69 - Lyon 3e Arrondissement",
    contract_type: "alternance",
    sector: "Commerce",
    description: "Prospection et suivi d'un portefeuille clients.",
    requirements: null,
    remote_policy: null,
    start_date: null,
    education_level: null,
    published_at: daysAgo(5),
    ...over,
  }) as Offer;

const score = (p: Profile, o: Offer) => computeMatchScore(p, o, NOW);

// 1. Alternance seulement : un stage passe loin derrière la même offre en alternance.
{
  const p = profile();
  const alt = score(p, offer());
  const stage = score(p, offer({ contract_type: "stage" }));
  assert.ok(alt - stage >= 30, `stage ${stage} vs alternance ${alt}`);
}

// 2. Le bon métier d'abord : « Commercial » bat « Employé de rayon » au même endroit.
{
  const p = profile();
  assert.ok(score(p, offer()) > score(p, offer({ title: "Employé libre-service (H/F)" })) + 20);
  // Métier visé classé dans un autre secteur (secteur deviné) : reste très bien noté.
  assert.ok(score(p, offer({ sector: "Immobilier" })) >= 75);
}

// 3. Département : une ville moyenne voit les communes de son département.
{
  const p = profile({ city: "Angers" });
  assert.equal(profileDepartement("Angers"), "49");
  assert.equal(geoMatch(p, offer({ location: "49 - Cholet" })).points, 8);
  assert.equal(geoMatch(p, offer({ location: "44 - Nantes" })).points, -30);
  assert.ok(score(p, offer({ location: "49 - Cholet" })) > score(p, offer({ location: "44 - Nantes" })) + 30);
  assert.ok(computeMatchReasons(p, offer({ location: "49 - Cholet" })).some((r) => r.includes("Maine-et-Loire")));
}

// 4. Département choisi à l'onboarding : avant, +4 pour toute la France.
{
  const p = profile({ city: "Rhône (69)" });
  assert.equal(profileDepartement("Rhône (69)"), "69");
  assert.equal(geoMatch(p, offer({ location: "69 - Givors" })).points, 14);
  assert.equal(geoMatch(p, offer({ location: "75 - Paris 8e" })).points, -30);
}

// 5. « Mobile dans la région » : la région, pas toute la France.
{
  const p = profile({ city: "Angers", mobility: "Mobile dans la région" });
  assert.equal(geoMatch(p, offer({ location: "44 - Nantes" })).points, 6);
  assert.equal(geoMatch(p, offer({ location: "13 - Marseille" })).points, -15);
}

// 6. Ville exacte et agglomération inchangées.
{
  const p = profile();
  assert.equal(geoMatch(p, offer({ location: "69 - Lyon 7e" })).points, 14);
  assert.equal(geoMatch(p, offer({ location: "Villeurbanne" })).points, 10);
  assert.equal(geoMatch(p, offer({ location: "69 - Givors" })).points, 8);
}

// 7. Niveau : un CAP cité dans la description ne va pas à un bac+3.
{
  const p = profile();
  assert.equal(educationGapPenalty(p, { title: "Vendeur (H/F)", description: "Contrat en alternance pour préparer un CAP Équipier polyvalent du commerce." }), -30);
  assert.equal(educationGapPenalty(p, { title: "Vendeur (H/F)", description: "Accueil et conseil des clients." }), 0);
}

// 8. Ancienneté : une offre de plus de deux mois passe derrière la même toute récente.
{
  const p = profile();
  assert.ok(score(p, offer({ published_at: daysAgo(1) })) - score(p, offer({ published_at: daysAgo(70) })) >= 12);
}

// 9. Doublons entre sources : une seule carte.
{
  const a = offer({ title: "Commercial terrain (H/F)", company: "Acme", location: "69 - Lyon 3e" });
  const b = offer({ title: "COMMERCIAL TERRAIN", company: "ACME", location: "Lyon, Rhône" });
  const c = offer({ title: "Commercial sédentaire", company: "Acme", location: "69 - Lyon 3e" });
  assert.deepEqual(dedupeOffers([a, b, c]).map((o) => o.id), [a.id, c.id]);
}

// 10. Une entreprise qui publie 10 annonces n'occupe pas tout le paquet.
{
  const spam = Array.from({ length: 10 }, (_, i) => offer({ company: "Intérim Plus", title: `Commercial ${i}` }));
  const others = Array.from({ length: 10 }, (_, i) => offer({ company: `PME ${i}`, title: `Commercial B2B ${i}` }));
  const deck = diversifyByCompany([...spam, ...others], 12).slice(0, 12);
  assert.equal(deck.filter((o) => o.company === "Intérim Plus").length, 2);
  assert.equal(deck.length, 12);
  // « Entreprise non communiquée » n'est pas une entreprise : pas plafonnée.
  const hidden = Array.from({ length: 5 }, () => offer({ company: "Entreprise non communiquée" }));
  assert.equal(diversifyByCompany(hidden, 5).slice(0, 5).length, 5);
}

// 11. Métier visé d'abord quand il y en a assez ; sinon l'ordre du score.
{
  const list = [...Array.from({ length: 5 }, () => ({ job: false })), ...Array.from({ length: 12 }, () => ({ job: true }))];
  assert.equal(preferTargetJobs(list, (o) => o.job).length, 12);
  assert.ok(preferTargetJobs(list, (o) => o.job).every((o) => o.job));
  const few = [{ job: false }, { job: true }];
  assert.equal(preferTargetJobs(few, (o) => o.job)[0].job, false);
}

// 12. Motifs de recherche par intitulé : tirés de la liste des métiers, accents tolérés.
{
  const patterns = targetJobTitlePatterns(["Développeur web"]);
  assert.ok(patterns.includes("d_v_lopp_u"));
  assert.ok(patterns.every((p) => /^[a-z_ ]+$/.test(p) && p.length >= 6));
  assert.ok(targetJobTitlePatterns(["Commercial"]).includes("comm_rci"));
  assert.deepEqual(targetJobTitlePatterns([]), []);
}

// 13. « Pas pour moi » : ce que retire chaque raison, tout de suite et ensuite.
{
  const t = (over: Partial<OfferTags> = {}): OfferTags => ({ near: true, local: true, targetJob: false, metier: "commercial", formations: [], contract: "alternance", ...over });
  const cards = [
    { id: "a", t: t({ near: false }) },
    { id: "b", t: t({ metier: "vente" }) },
    { id: "c", t: t({ formations: ["cap"] }) },
    { id: "d", t: t({ contract: "stage" }) },
  ];
  const tagsOf = (o: { id: string }) => cards.find((c) => c.id === o.id)!.t;
  assert.deepEqual([...cardsToDrop(cards, t({ near: false }), "loin", tagsOf)], ["a"]);
  assert.deepEqual([...cardsToDrop(cards, t({ metier: "vente" }), "metier", tagsOf)], ["b"]);
  assert.deepEqual([...cardsToDrop(cards, t({ formations: ["cap"] }), "niveau", tagsOf)], ["c"]);
  assert.deepEqual([...cardsToDrop(cards, t({ contract: "stage" }), "contrat", tagsOf)], ["d"]);
  // « Pas mon métier » sur son propre métier visé : rien n'est retiré.
  assert.equal(cardsToDrop(cards, t({ metier: "vente", targetJob: true }), "metier", tagsOf).size, 0);
  // « Trop loin » sur une offre de son département : seulement sa ville reste.
  const deptCards = [{ id: "x", t: t({ local: false }) }, { id: "y", t: t() }];
  assert.deepEqual([...cardsToDrop(deptCards, t({ local: false }), "loin", (o) => deptCards.find((c) => c.id === o.id)!.t)], ["x"]);
  // Jamais tout le paquet.
  assert.equal(cardsToDrop([{ id: "a" }], t({ near: false }), "loin", () => t({ near: false })).size, 0);

  const learned = learnFromPassReasons([
    { reason: "loin" },
    { reason: "loin" },
    { reason: "metier", metier: "vente" },
    { reason: "contrat", contract: "stage" },
  ]);
  assert.equal(learned.penalty(t({ near: false }), false), -25);
  assert.equal(learned.penalty(t({ metier: "vente" }), false), -20);
  assert.equal(learned.penalty(t({ metier: "vente" }), true), 0); // c'est le métier visé : on ne le punit pas
  assert.equal(learned.penalty(t({ contract: "stage" }), false), -25);
  assert.equal(learned.penalty(t(), false), 0);
  const strict = learnFromPassReasons([{ reason: "loin", near: true }]);
  assert.equal(strict.penalty(t({ local: false }), false), -12);
  assert.equal(learnFromPassReasons([{ reason: "metier", metier: "vente", targetJob: true }]).penalty(t({ metier: "vente" }), false), 0);
}

console.log("deck-relevance : OK");
