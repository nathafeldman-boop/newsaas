// Retour sur l'offre cliquée après l'inscription (6/11) : la fiche publique
// ouverte (post LinkedIn, Google…) devient la première carte du paquet.
// Lancer : npx tsx --tsconfig tsconfig.json tests/retour-offre.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { offerIdFromPath, pinFirst, pinnedOfferId, PINNED_OFFER_COOKIE, PINNED_OFFER_MAX_AGE } from "../src/lib/offers/pinnedOffer";
import { offerPath } from "../src/lib/offers/publicUrl";

const ID = "3f2b8c1e-7a4d-4e1b-9c2a-5d6e7f8a9b0c";
const offer = { id: ID, title: "Alternance assistante RH", company: "Groupe Exemple", location: "69 - Lyon" };

// Fiches d'offres seulement.
assert.equal(offerIdFromPath(offerPath(offer)), ID);
assert.equal(offerIdFromPath(`${offerPath(offer)}/`), ID);
assert.equal(offerIdFromPath(`/offres/${ID.toUpperCase()}`), ID, "identifiant seul, en majuscules");
for (const path of ["/offres", "/offres/alternance", "/offres/stage", "/offres/ville/lyon", "/offres/secteur/rh", `/offres/x-${ID}/opengraph-image`, `/alternance/${ID}`, "/swipe"]) {
  assert.equal(offerIdFromPath(path), null, path);
}

// Cookie : 3 jours, un identifiant d'offre et rien d'autre.
assert.equal(PINNED_OFFER_COOKIE, "offre_vue");
assert.equal(PINNED_OFFER_MAX_AGE, 3 * 86_400);
assert.equal(pinnedOfferId(ID), ID);
assert.equal(pinnedOfferId("pas-une-offre"), null);
assert.equal(pinnedOfferId(undefined), null);

// Première carte, une seule fois, paquet de la même taille.
const deck = ["a", "b", "c"].map((id) => ({ id }));
assert.deepEqual(pinFirst(deck, { id: "z" }, 3).map((o) => o.id), ["z", "a", "b"]);
assert.deepEqual(pinFirst(deck, { id: "b" }, 3).map((o) => o.id), ["b", "a", "c"], "déjà dans le paquet : remontée, pas en double");
assert.deepEqual(pinFirst(deck, { id: "z" }, 30).map((o) => o.id), ["z", "a", "b", "c"]);
assert.equal(pinFirst(deck, null, 3), deck);

// Branchements.
const proxy = readFileSync("src/proxy.ts", "utf8");
assert.ok(proxy.includes("const viewedOfferId = isPageLoad ? offerIdFromPath(request.nextUrl.pathname) : null;"), "ouvertures de page seulement");
assert.ok(proxy.includes("response.cookies.set(PINNED_OFFER_COOKIE, viewedOfferId"));
const swipe = readFileSync("src/app/(app)/swipe/page.tsx", "utf8");
assert.ok(swipe.includes("!excludeIds.includes(pinnedId) && !appliedOfferIds.has(pinnedId)"), "jamais une offre likée, passée récemment ou envoyée");
assert.ok(swipe.includes('.eq("is_active", true)'), "jamais une offre retirée");
assert.ok(swipe.includes("const sortedOffers = pinFirst(rankedDeck, pinned, DECK_SIZE);"));
assert.ok(swipe.includes("for (const offer of scoredOffers)"), "score et étiquettes de la carte épinglée");
console.log("retour-offre : ok");
