// Offres France Travail « indisponibles » (4/11, satisfaction : « Lorsque je vais sur le site pour
// postuler celui-ci est indisponible d'accès ») : l'API listait encore l'offre, sa page publique
// renvoyait 404. Le contrôle regarde aussi la page, mais ne retire jamais sur un simple refus.
// Lancer : npx tsx --tsconfig tsconfig.json tests/ft-page-status.test.ts
import assert from "node:assert/strict";
import { fetchFranceTravailOfferStatus, fetchFranceTravailPageStatus } from "../src/lib/franceTravail/client";

process.env.FRANCE_TRAVAIL_CLIENT_ID = "id";
process.env.FRANCE_TRAVAIL_CLIENT_SECRET = "secret";

type Routes = { api: number; page: number | "throw"; apiBody?: unknown };
function mockFetch(routes: Routes) {
  const seen: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    seen.push(url);
    if (url.includes("access_token")) return new Response(JSON.stringify({ access_token: "t", expires_in: 1500 }), { status: 200 });
    if (url.includes("api.francetravail.io")) {
      return new Response(routes.api === 200 ? JSON.stringify(routes.apiBody ?? { id: "8410995" }) : null, { status: routes.api });
    }
    if (url.includes("candidat.francetravail.fr")) {
      if (routes.page === "throw") throw new Error("réseau");
      return new Response("<html></html>", { status: routes.page });
    }
    throw new Error(`appel inattendu : ${url}`);
  }) as typeof fetch;
  return seen;
}

void (async () => {
  // La page publique en 404 alors que l'API dit « en ligne » : offre disparue (cas de l'offre « Logisticien »).
  let seen = mockFetch({ api: 200, page: 404 });
  assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "gone");
  assert.ok(seen.some((u) => u.includes("candidat.francetravail.fr/offres/recherche/detail/8410995")));

  // Page en 200 : en ligne.
  mockFetch({ api: 200, page: 200 });
  assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "live");

  // France Travail refuse notre contrôle (403, 429, 503) ou ne répond pas : l'offre reste « en ligne », jamais retirée sur un doute.
  for (const page of [403, 429, 503] as const) {
    mockFetch({ api: 200, page });
    assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "live", `page ${page}`);
  }
  mockFetch({ api: 200, page: "throw" });
  assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "live");

  // Sans l'option, la page n'est pas lue (synchro de nuit : pas d'appel de plus par offre).
  seen = mockFetch({ api: 200, page: 404 });
  assert.equal(await fetchFranceTravailOfferStatus("8410995"), "live");
  assert.ok(!seen.some((u) => u.includes("candidat.francetravail.fr")));

  // L'API dit « disparue » : inutile de lire la page.
  seen = mockFetch({ api: 204, page: 200 });
  assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "gone");
  assert.ok(!seen.some((u) => u.includes("candidat.francetravail.fr")));

  // API en panne : doute, rien ne change.
  mockFetch({ api: 500, page: 404 });
  assert.equal(await fetchFranceTravailOfferStatus("8410995", 2500, { checkPage: true }), "unknown");

  // La page seule.
  mockFetch({ api: 200, page: 410 });
  assert.equal(await fetchFranceTravailPageStatus("215VNSH"), "gone");
  mockFetch({ api: 200, page: 200 });
  assert.equal(await fetchFranceTravailPageStatus("215VNSH"), "live");

  console.log("ft-page-status : OK");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
