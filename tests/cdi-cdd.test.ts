// CDI/CDD (07/11) : offres d'emploi ouvertes aux débutants. Une offre n'est
// classée CDI/CDD que dans le flux d'emploi, jamais une alternance déjà en
// base réécrite en CDI ; les profils d'avant ne voient pas de CDI/CDD.
// Lancer : npx tsx --tsconfig tsconfig.json tests/cdi-cdd.test.ts
import assert from "node:assert/strict";
import { mapFranceTravailJob } from "../src/lib/franceTravail/mapOffer";
import { searchFranceTravailPage, type FranceTravailJob } from "../src/lib/franceTravail/client";
import { emploisQueries } from "../src/lib/franceTravail/emploisSync";
import { deckContractTypes } from "../src/lib/offers/fetchActiveOffers";
import { contractNouns } from "../src/lib/offers/contractLabels";
import { resolveSignupIntent } from "../src/lib/signup/intent";
import { typePhrase } from "../src/lib/campaigns/relanceOffres";

const base: FranceTravailJob = {
  id: "200ABC",
  intitule: "Vendeur en boulangerie (H/F)",
  description: "Accueil des clients, mise en rayon, encaissement.",
  dateCreation: "2026-11-06T09:00:00Z",
  lieuTravail: { libelle: "75 - Paris 11e" },
  origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/recherche/detail/200ABC" },
  typeContrat: "CDI",
};

// Flux d'emploi : CDI et CDD.
assert.equal(mapFranceTravailJob(base, { emploi: true })?.contract_type, "cdi");
assert.equal(mapFranceTravailJob({ ...base, typeContrat: "CDD" }, { emploi: true })?.contract_type, "cdd");
// Intérim, saisonnier : écartés.
assert.equal(mapFranceTravailJob({ ...base, typeContrat: "MIS" }, { emploi: true }), null);
// Hors flux d'emploi : comportement d'avant, un CDI est écarté.
assert.equal(mapFranceTravailJob(base), null);
// Alternance structurée : reste une alternance, même dans le flux d'emploi.
assert.equal(mapFranceTravailJob({ ...base, typeContrat: "CDD", alternance: true }, { emploi: true })?.contract_type, "alternance");
// Intitulé « stage » : reste un stage.
assert.equal(mapFranceTravailJob({ ...base, intitule: "Stage vendeur" }, { emploi: true })?.contract_type, "stage");
// Seule la description parle d'alternance : laissée aux autres synchros,
// jamais réécrite en CDI.
assert.equal(
  mapFranceTravailJob({ ...base, description: "Poste en alternance, contrat d'apprentissage de 2 ans." }, { emploi: true }),
  null,
);

// Requêtes : débutants, plus récentes d'abord, 13 régions × CDI/CDD la nuit.
const now = Date.parse("2026-11-07T20:00:00Z");
const full = emploisQueries("full", now);
assert.equal(full.length, 13 * 2 * 7);
assert.ok(full.every((q) => q.experience === "1" && q.region && q.minCreationDate && q.maxCreationDate && !q.sort && !q.publieeDepuis));
assert.equal(full[0].maxCreationDate, "2026-11-07T20:00:00Z");
assert.equal(full[6].minCreationDate, "2026-10-24T20:00:00Z");
const fresh = emploisQueries("fresh", now);
assert.deepEqual(fresh.map((q) => q.typeContrat), ["CDI", "CDD"]);
assert.ok(fresh.every((q) => q.minCreationDate === "2026-11-07T17:00:00Z" && !q.region));

// Paramètres envoyés à l'API.
process.env.FRANCE_TRAVAIL_CLIENT_ID = "id";
process.env.FRANCE_TRAVAIL_CLIENT_SECRET = "secret";
let searched = "";
globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  if (url.includes("access_token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
  searched = url;
  return new Response(null, { status: 204 });
}) as typeof fetch;
void searchFranceTravailPage(full[0], 0, 149).then(() => {
  const params = new URL(searched).searchParams;
  assert.equal(params.get("typeContrat"), "CDI");
  assert.equal(params.get("experience"), "1");
  assert.equal(params.get("minCreationDate"), "2026-11-05T20:00:00Z");
  assert.equal(params.get("region"), "11");
  assert.equal(params.get("sort"), null);
  console.log("cdi-cdd (API) : OK");
});

// Deck : CDI/CDD seulement pour qui les a cochés.
assert.deepEqual(deckContractTypes([]), ["alternance", "stage"]);
assert.deepEqual(deckContractTypes(null), ["alternance", "stage"]);
assert.deepEqual(deckContractTypes(["alternance", "stage"]), ["alternance", "stage"]);
assert.deepEqual(deckContractTypes(["cdi"]), ["cdi"]);

// Textes.
assert.equal(contractNouns(["cdi"], "ton"), "ton CDI");
assert.equal(contractNouns(["stage", "cdi", "cdd"], "ton"), "ton CDI, ton CDD ou ton stage");
assert.equal(contractNouns([], "leur"), "leur alternance ou leur stage");
assert.equal(typePhrase(["alternance", "stage"]), "d'alternance et de stage");
assert.equal(typePhrase(["cdi"]), "en CDI");
assert.equal(typePhrase(["cdi", "alternance"]), "d'emploi");
assert.equal(resolveSignupIntent({ type: "cdi" }).type, "cdi");
assert.equal(resolveSignupIntent({ type: "freelance" }).type, null);

console.log("cdi-cdd : OK");

// Garde-fou : l'API renvoie toujours la même page (7/11) -> arrêt après la
// 2e page, une erreur notée, pas 8 pages relues.
import { runFranceTravailStream } from "../src/lib/franceTravail/sync";
setTimeout(() => {
  let calls = 0;
  const samePage = Array.from({ length: 150 }, (_, i) => ({ ...base, id: `X${i}` }));
  globalThis.fetch = (async (input: string | URL | Request) => {
    if (String(input).includes("access_token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), { status: 200 });
    calls++;
    return new Response(JSON.stringify({ resultats: samePage }), { status: 206, headers: { "Content-Range": "offres 0-149/5000" } });
  }) as typeof fetch;
  const admin = { from: () => ({ upsert: async () => ({ error: null }) }) } as never;
  void runFranceTravailStream(admin, "2026-11-07T20:00:00Z", { typeContrat: "CDI", experience: "1" }, { emploi: true }).then((r) => {
    assert.equal(calls, 2);
    assert.equal(r.fetched, 150);
    assert.match(r.errors[0], /identique/);
    console.log("cdi-cdd (page identique) : OK");
  });
}, 1500);
