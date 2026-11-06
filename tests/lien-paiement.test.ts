// Lien de paiement des emails sans connexion (6/11, Nathan : « fais les 3 ») :
// le lien porte le compte, une date de fin et une signature ; /premium/go
// montre alors la page publique /paiement, dont le bouton ouvre le paiement
// Stripe du compte, au prix qui est le sien.
// Lancer : npx tsx --tsconfig tsconfig.json tests/lien-paiement.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GO_LINK_TTL_MS, goLink, goSignature, verifyGoParams } from "../src/lib/premium/goLink";
import { goPlanOffer, isGoCheckoutPlan, maskEmail } from "../src/lib/premium/goOffer";
import { AUTO_PRICES, FLASH_OFFER, PLAN_PRICES } from "../src/lib/pricing/plans";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const UTM = "utm_source=email&utm_medium=campagne&utm_campaign=offre_48h_2026_11";
const now = Date.parse("2026-11-06T12:00:00Z");
const savedKeys = { link: process.env.PAYMENT_LINK_SECRET, service: process.env.SUPABASE_SERVICE_ROLE_KEY };
const parse = (url: string) => Object.fromEntries(new URL(url).searchParams);

// Sans clé serveur : le lien d'avant, sans signature (connexion).
delete process.env.PAYMENT_LINK_SECRET;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(goSignature(USER, now), "");
assert.ok(goLink(USER, "lifetime", UTM, now).endsWith(`/premium/go?plan=lifetime&${UTM}`));
assert.equal(verifyGoParams({ u: USER, e: "1999999999", s: "x".repeat(32) }, now), null);

// Avec la clé : formule, suivi, puis compte, fin et signature.
process.env.PAYMENT_LINK_SECRET = "cle-de-test";
const link = goLink(USER, "lifetime", UTM, now);
assert.ok(link.includes(`/premium/go?plan=lifetime&${UTM}&u=${USER}&e=`), link);
const q = parse(link);
assert.equal(q.utm_campaign, "offre_48h_2026_11", "le suivi reste lisible");
assert.equal(Number(q.e), Math.floor((now + GO_LINK_TTL_MS) / 1000), "fin dans 14 jours");
assert.equal(q.s.length, 32);
assert.equal(verifyGoParams(q, now), USER, "le bon lien ouvre le paiement du compte");
assert.equal(verifyGoParams(q, now + GO_LINK_TTL_MS - 1000), USER, "encore bon la veille de la fin");
assert.equal(verifyGoParams(q, now + GO_LINK_TTL_MS + 1000), null, "expiré");
assert.equal(verifyGoParams({ ...q, u: OTHER }, now), null, "un autre compte");
assert.equal(verifyGoParams({ ...q, e: String(Number(q.e) + 86_400) }, now), null, "fin repoussée à la main");
assert.equal(verifyGoParams({ ...q, s: q.s.slice(0, 31) }, now), null, "signature tronquée");
assert.equal(verifyGoParams({ ...q, s: `${q.s.slice(0, 31)}${q.s[31] === "A" ? "B" : "A"}` }, now), null, "signature modifiée");
assert.equal(verifyGoParams({ ...q, u: "pas-un-uuid" }, now), null);
assert.equal(verifyGoParams({ ...q, e: "abc" }, now), null);
assert.equal(verifyGoParams({ u: q.u, e: q.e }, now), null, "sans signature");
assert.equal(verifyGoParams({ ...q, u: USER.toUpperCase() }, now), USER, "majuscules : même compte");
assert.equal(goSignature("pas-un-uuid", now), "", "jamais de lien signé pour un identifiant invalide");
// La signature ne dépend pas de la formule : chaque bouton de l'email a la sienne… identique.
assert.equal(parse(goLink(USER, "monthly", UTM, now)).s, q.s);
process.env.PAYMENT_LINK_SECRET = "autre-cle";
assert.equal(verifyGoParams(q, now), null, "clé changée : anciens liens refusés");
// Sans PAYMENT_LINK_SECRET, la clé service de Supabase sert de clé.
delete process.env.PAYMENT_LINK_SECRET;
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
assert.equal(verifyGoParams(parse(goLink(USER, "lifetime", UTM, now)), now), USER);

// Formules acceptées par le lien.
assert.ok(isGoCheckoutPlan("monthly") && isGoCheckoutPlan("lifetime") && isGoCheckoutPlan("auto_lifetime"));
assert.ok(!isGoCheckoutPlan("auto_monthly"), "l'Auto mensuel peut prélever la carte enregistrée sans page Stripe");
assert.ok(!isGoCheckoutPlan("daily") && !isGoCheckoutPlan(null));

// Prix montré par /paiement : celui que startCheckout encaisse.
const flash = { active: true, endsAt: now + 20 * 60_000, flashEndsAt: now + 20 * 60_000, legacy: false };
const welcome = { active: true, endsAt: now + 10 * 60_000, flashEndsAt: null, legacy: false };
const expired = { active: false, endsAt: now - 1, flashEndsAt: null, legacy: false };

const lifeFlash = goPlanOffer("lifetime", flash, now);
assert.equal(lifeFlash.price, FLASH_OFFER.lifetimePrice);
assert.equal(lifeFlash.badge, "Offre de l'email");
assert.equal(lifeFlash.endsAt, flash.endsAt);
assert.equal(lifeFlash.minutesLeft, 20);
assert.equal(goPlanOffer("lifetime", flash, flash.endsAt - 30_000).minutesLeft, 1, "jamais « 0 minute »");
assert.equal(lifeFlash.regular, PLAN_PRICES.lifetime.regular);
assert.equal(goPlanOffer("auto_lifetime", flash, now).price, FLASH_OFFER.autoLifetimePrice);
assert.equal(goPlanOffer("monthly", flash, now).price, PLAN_PRICES.monthly.welcome);

assert.equal(goPlanOffer("lifetime", welcome, now).price, PLAN_PRICES.lifetime.welcome);
assert.equal(goPlanOffer("lifetime", welcome, now).badge, "Prix de bienvenue");
assert.equal(goPlanOffer("auto_lifetime", welcome, now).price, AUTO_PRICES.lifetime.welcome);

for (const state of [expired, null]) {
  const life = goPlanOffer("lifetime", state, now);
  assert.equal(life.price, PLAN_PRICES.lifetime.regular);
  assert.equal(life.regular, null, "au prix normal, pas de « ensuite »");
  assert.equal(life.badge, null);
  assert.equal(life.endsAt, null);
  assert.equal(life.minutesLeft, null);
  assert.equal(goPlanOffer("monthly", state, now).price, PLAN_PRICES.monthly.regular);
  assert.equal(goPlanOffer("auto_lifetime", state, now).price, AUTO_PRICES.lifetime.regular);
}
// Fin de l'offre passée entre deux lectures : plus de prix de l'email.
assert.equal(goPlanOffer("lifetime", flash, flash.endsAt + 1).price, PLAN_PRICES.lifetime.regular);
assert.ok(goPlanOffer("monthly", welcome, now).perMonth && !goPlanOffer("lifetime", welcome, now).perMonth);

assert.equal(maskEmail("nathan@gmail.com"), "na•••@gmail.com");
assert.equal(maskEmail("a@b.fr"), "a•••@b.fr");
assert.equal(maskEmail("sans-arobase"), null);
assert.equal(maskEmail(null), null);

// Garde-fous dans le code.
const route = readFileSync("src/app/(app)/premium/go/route.ts", "utf8");
assert.ok(route.includes("verifyGoParams") && route.includes('new URL("/paiement"'), "lien signé : page publique");
assert.ok(!/startCheckout\([^)]*guest/.test(route), "la route n'ouvre jamais de paiement sans session (robots antispam)");
const middleware = readFileSync("src/lib/supabase/middleware.ts", "utf8");
assert.ok(middleware.includes('pathname === "/premium/go" && request.nextUrl.searchParams.has("s")'));
const page = readFileSync("src/app/paiement/page.tsx", "utf8");
assert.ok(page.includes("<form action={payFromEmailLinkAction}"), "le paiement part du bouton");
assert.ok(!page.includes("logServerEvent") && !page.includes("startCheckout"), "rien d'enregistré à l'affichage");
assert.ok(page.includes("index: false"));
assert.ok(!page.includes("line-through"), "jamais de prix barré (pas d'annonce de réduction)");
const action = readFileSync("src/app/paiement/actions.ts", "utf8");
assert.ok(action.includes("verifyGoParams(signed)") && action.includes("guest: {"), "signature revérifiée au clic");
assert.ok(action.indexOf('"paywall_viewed"') > action.indexOf('if ("error" in result)'), "le délai de l'offre s'ouvre après le calcul du prix");
const checkout = readFileSync("src/lib/stripe/startCheckout.ts", "utf8");
assert.ok(checkout.includes('if (options.guest) return { error: "login_required" };'), "jamais de prélèvement direct sans session");
assert.ok(checkout.includes("options.guest ? createAdminClient() : await createClient()"), "sans session, le profil est lu en admin");
assert.ok(checkout.includes("/paiement-recu?session_id={CHECKOUT_SESSION_ID}"));
const reconcile = readFileSync("src/lib/stripe/reconcileCheckout.ts", "utf8");
assert.ok(reconcile.includes('session.status === "complete"') && reconcile.includes("if (!paid) return { userId, paid: false };"), "accès posé seulement si payé");

process.env.PAYMENT_LINK_SECRET = savedKeys.link;
process.env.SUPABASE_SERVICE_ROLE_KEY = savedKeys.service;
if (savedKeys.link === undefined) delete process.env.PAYMENT_LINK_SECRET;
if (savedKeys.service === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("lien-paiement : ok");
