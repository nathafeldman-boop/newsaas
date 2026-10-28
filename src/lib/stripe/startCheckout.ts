import { cookies } from "next/headers";
import { after } from "next/server";
import Stripe from "stripe";
import { recordCheckoutOpened } from "@/lib/stripe/checkoutReminder";
import { AUTO_PRICE_IDS, LIFETIME_PROMO, REGULAR_PRICE_IDS } from "@/lib/pricing/plans";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { isAutoOfferAvailable } from "@/lib/subscription/autoAvailability";
import type { Profile } from "@/types/database";
import { getFlashEndsAt, getWelcomeEndsAt } from "@/lib/pricing/welcome";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { SITE_URL } from "@/lib/site";
import { GUARANTEE_COOKIE, GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";

async function getOrCreateStripeCustomer(userId: string, email: string | null) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  // Client admin : les colonnes de paiement ne sont écrites que par le
  // serveur (trigger protect_paid_profile_columns, SQL du 24/10).
  await createAdminClient()
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export type CheckoutError = "already_subscribed" | "not_configured" | "checkout_failed" | "upgrade_failed";

// Page de paiement Stripe aux couleurs de Stageio (28/10, Nathan : « les
// gens arrivent sur la page de paiement mais ne paient pas » ; 1 paiement
// sur 6 personnes ce jour-là, et aucune n'avait même essayé une carte). Le
// compte Stripe est partagé : son nom (« SMARTAPP ») et son bouton bleu
// s'affichaient en haut de la page. Réglages posés session par session
// (branding_settings), jamais sur le compte. Sous le bouton payer, ce qui
// rassure : paiement sécurisé, accès immédiat, sans engagement (mensuel) ou
// paiement unique (à vie), et la garantie quand l'étudiant l'a vue.
async function checkoutPresentation(lifetime: boolean): Promise<Pick<Stripe.Checkout.SessionCreateParams, "branding_settings" | "custom_text">> {
  const guarantee = !!(await cookies()).get(GUARANTEE_COOKIE);
  const message = [
    "🔒 Paiement sécurisé par Stripe pour Stageio. Ton accès s'ouvre dès le paiement.",
    lifetime ? "Paiement unique : aucun abonnement, rien à résilier." : "Sans engagement : tu résilies quand tu veux, depuis ton compte Stageio.",
    guarantee ? `🛡️ Garantie : aucun entretien en ${GUARANTEE_MONTHS} mois de Premium = remboursé (conditions dans les CGV).` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    branding_settings: {
      display_name: "Stageio",
      button_color: "#0f9c56",
      background_color: "#ffffff",
      border_style: "rounded",
      font_family: "inter",
      icon: { type: "url", url: `${SITE_URL}/logo.png` },
    },
    custom_text: { submit: { message } },
  };
}

// Si Stripe refuse l'habillage (logo injoignable, réglage refusé), la page de
// paiement s'ouvre quand même, sans lui : jamais de paiement bloqué pour ça.
async function createCheckoutSession(params: Stripe.Checkout.SessionCreateParams, lifetime: boolean): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  try {
    return await stripe.checkout.sessions.create({ ...params, ...(await checkoutPresentation(lifetime)) });
  } catch (err) {
    if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) throw err;
    console.error("startCheckout: habillage Stageio refusé par Stripe, page standard", err.message);
    return stripe.checkout.sessions.create(params);
  }
}

// Création de la session Stripe Checkout, commune au bouton de /premium
// (server action) et au lien direct des emails de vente (/premium/go).
export async function startCheckout(
  user: { id: string; email: string | null },
  plan: unknown,
): Promise<{ url: string } | { error: CheckoutError }> {
  const supabase = await createClient();

  if (plan === "auto_monthly" || plan === "auto_lifetime") return startAutoCheckout(user, plan);

  // Garde-fou serveur : /premium masque déjà le bouton "Débloquer Premium"
  // pour un profil Premium (voir isPremium() côté page), mais c'est
  // purement cosmétique -- rien n'empêchait cette action elle-même d'être
  // rappelée (deux onglets ouverts, retour arrière/bfcache sur un rendu
  // pré-paiement de /premium) pendant qu'un abonnement Stripe est déjà
  // actif. Stripe n'impose aucune limite "un seul abonnement par client" :
  // sans ce check, ça créait un DEUXIÈME abonnement indépendant sur la
  // même carte -- double prélèvement réel jusqu'à ce que quelqu'un s'en
  // aperçoive. On ne bloque que s'il existe un VRAI abonnement Stripe actif
  // (stripe_subscription_id) : un statut "comp" (accès offert par un code
  // admin, jamais de Stripe derrière) doit au contraire pouvoir souscrire
  // normalement s'il le souhaite. Bug réel trouvé à l'audit du 2026-09-25.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();
  if (
    (existingProfile?.stripe_subscription_id &&
      (existingProfile.subscription_status === "active" || existingProfile.subscription_status === "trialing")) ||
    // "lifetime" n'a jamais de stripe_subscription_id (paiement unique, pas
    // d'abonnement Stripe) -- check à part : un accès à vie déjà acquis ne
    // doit jamais pouvoir en racheter un second, ni repasser sur le mensuel.
    existingProfile?.subscription_status === "lifetime"
  ) {
    return { error: "already_subscribed" };
  }

  // "plan" est posé par un input hidden dans chaque carte de prix (voir
  // /premium). Formule hebdomadaire retirée le 26/09 (décision produit avec
  // l'associé de Nathan, voir RETENTION_AUDIT.md) : elle générait
  // l'essentiel des paiements en échec observés le 25/09 (petits montants
  // récurrents, clientèle étudiante -- voir l'échange avec Nathan) et le
  // hard paywall rend de toute façon "tester Premium sur une candidature
  // urgente" sans objet. Remplacée par une formule à vie (paiement unique).
  // Formule quotidienne définitivement retirée (demande Nathan du 24/09,
  // après le délai de 24h annoncé le 22/09) : rejetée explicitement plutôt
  // que silencieusement retombée sur le mensuel, au cas où un onglet resté
  // ouvert ou un lien direct tenterait quand même ces anciens plans.
  if (plan === "daily" || plan === "weekly") {
    return { error: "not_configured" };
  }
  const isLifetime = plan === "lifetime";
  // Prix de bienvenue (anciens prix) tant que ses 10 minutes ne sont pas
  // écoulées, prix réguliers ensuite (voir lib/pricing/plans.ts). Une minute
  // de marge : un clic à 19:59 garde le prix affiché sur le bouton.
  // Offre 48 h par email (FLASH_OFFER) : prix de bienvenue et accès à vie à
  // 30 € jusqu'à la fin de l'offre du compte (même minute de marge).
  const [welcomeEndsAt, flashEndsAt] = await Promise.all([getWelcomeEndsAt(user.id), getFlashEndsAt(user.id)]);
  const now = Date.now();
  const flash = flashEndsAt !== null && now <= flashEndsAt + 60_000;
  const welcome = flash || now <= welcomeEndsAt + 60_000;
  // Promo accès à vie (30 € au lieu de 39,99 €) : pendant le prix de
  // bienvenue seulement, tant que la promo dure (même minute de marge).
  const promo = isLifetime && (flash || (welcome && now <= LIFETIME_PROMO.endsAt + 60_000));
  const rawPriceId = promo
    ? LIFETIME_PROMO.priceId
    : welcome
    ? isLifetime
      ? process.env.STRIPE_PRICE_ID_LIFETIME
      : process.env.STRIPE_PRICE_ID
    : isLifetime
      ? REGULAR_PRICE_IDS.lifetime
      : REGULAR_PRICE_IDS.monthly;
  // .trim() : Stripe rejette un ID avec un espace superflu ("No such
  // price") sans distinguer ça d'un ID réellement invalide -- un simple
  // copier-coller depuis le dashboard Stripe vers Vercel embarque parfois
  // un espace en fin de valeur, invisible dans l'interface. Coûte rien de
  // s'en protéger ici plutôt que de dépendre d'une variable d'env toujours
  // parfaitement propre.
  const priceId = rawPriceId?.trim() || undefined;
  if (!priceId) {
    return { error: "not_configured" };
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  const session = await createCheckoutSession({
    mode: isLifetime ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Carte uniquement : laissé aux méthodes de paiement dynamiques par
    // défaut de Stripe (qui incluent Link), TOUS les renouvellements en
    // échec constatés le 2026-09-25 payaient via "Link", pas une carte
    // enregistrée directement (voir échange avec Nathan -- décline
    // générique de la banque, payment_intent_generic_payment_failed, sur
    // des abonnements qui renouvelaient pourtant à une date tout à fait
    // normale). Ne corrige pas les abonnements déjà sur Link aujourd'hui
    // (rien à faire côté Checkout pour eux, seul le portail Stripe permet
    // de changer leur moyen de paiement), mais évite d'en créer de
    // nouveaux tant que l'hypothèse Link n'est pas formellement écartée.
    payment_method_types: ["card"],
    // session_id transmis à /premium/success : filet de secours qui
    // resynchronise l'abonnement (ou l'achat à vie) à la volée si le
    // webhook Stripe n'est jamais arrivé ou a échoué (voir ce fichier pour
    // le contexte -- un paiement réel resté sans effet, découvert en prod).
    success_url: `${SITE_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    // Retour sans payer : droit au paywall, sans repasser par l'engagement.
    cancel_url: `${SITE_URL}/premium?retour=paiement`,
    client_reference_id: user.id,
    ...(isLifetime
      ? {
          // mode "payment" n'a pas de subscription_data -- payment_intent_data
          // est l'équivalent pour y accrocher le même metadata. invoice_creation
          // génère une vraie Facture Stripe pour cet achat ponctuel : sans ça,
          // le webhook invoice.paid (qui crédite le LTV et la commission
          // affilié, voir creditInvoicePayment/creditAffiliateCommission) ne se
          // déclencherait jamais pour un paiement one-shot -- toute la
          // plomberie existante (pensée pour des factures d'abonnement) reste
          // ainsi valable sans dupliquer sa logique pour ce nouveau mode.
          payment_intent_data: { metadata: { supabase_user_id: user.id } },
          invoice_creation: { enabled: true },
        }
      : { subscription_data: { metadata: { supabase_user_id: user.id } } }),
  }, isLifetime);

  if (!session.url) return { error: "checkout_failed" };
  // Mesure seulement (tableau « Chemin de Léo » de l'admin), rien de visible.
  // Noté (Chemin de Léo), et relance programmée à +10 min si le paiement
  // n'aboutit pas (annulée par le webhook sinon). Après la redirection.
  const checkoutUrl = session.url;
  after(() => recordCheckoutOpened({ userId: user.id, email: user.email, checkoutUrl, lifetime: isLifetime, welcome, promo }));
  return { url: checkoutUrl };
}

// Formule « Stageio Auto » (24/10) : 17,99 €/mois ou 80 € à vie, ouverte
// aussi aux comptes déjà Premium (c'est une montée en gamme) :
// - abonné Premium mensuel qui prend l'Auto mensuel : son abonnement passe
//   au prix Auto, au prorata, payé tout de suite avec sa carte enregistrée
//   (et rien ne change si le paiement échoue : pending_if_incomplete) ;
// - abonné Premium mensuel qui prend l'Auto à vie : paiement unique, puis
//   son abonnement s'arrête à la fin de la période déjà payée ;
// - accès à vie Premium : il peut prendre l'Auto, mensuel ou à vie.
// Jamais deux abonnements Auto ; rien ne part tant que la colonne
// premium_tier (SQL du 24/10) n'existe pas.
async function startAutoCheckout(
  user: { id: string; email: string | null },
  plan: "auto_monthly" | "auto_lifetime",
): Promise<{ url: string } | { error: CheckoutError }> {
  const supabase = await createClient();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !profile || !isAutoOfferAvailable(profile)) {
    if (error) console.error("startAutoCheckout: profil illisible", error.message);
    return { error: "not_configured" };
  }
  if (isAutoTier(profile as Profile)) return { error: "already_subscribed" };

  const lifetime = plan === "auto_lifetime";
  const priceId = lifetime ? AUTO_PRICE_IDS.lifetime : AUTO_PRICE_IDS.monthly;
  const activeSubscription =
    profile.stripe_subscription_id && (profile.subscription_status === "active" || profile.subscription_status === "trialing")
      ? profile.stripe_subscription_id
      : null;
  const stripe = getStripeClient();

  if (!lifetime && activeSubscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(activeSubscription);
      const item = subscription.items.data[0];
      if (!item) return { error: "upgrade_failed" };
      const updated = await stripe.subscriptions.update(activeSubscription, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
        metadata: { ...subscription.metadata, tier: "auto" },
      });
      if (updated.pending_update) return { error: "upgrade_failed" };
      await syncSubscriptionToProfile(updated);
      after(() => logAutoUpgrade(user.id, activeSubscription));
      return { url: `${SITE_URL}/premium/success?auto=1` };
    } catch (err) {
      console.error("startAutoCheckout: passage à Auto en échec", err instanceof Error ? err.message : err, { userId: user.id });
      return { error: "upgrade_failed" };
    }
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);
  const metadata: Record<string, string> = { tier: "auto", supabase_user_id: user.id };
  if (lifetime && activeSubscription) metadata.replace_subscription = activeSubscription;
  const session = await createCheckoutSession({
    mode: lifetime ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card"],
    success_url: `${SITE_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/premium?retour=paiement`,
    client_reference_id: user.id,
    metadata,
    ...(lifetime
      ? { payment_intent_data: { metadata: { supabase_user_id: user.id, tier: "auto" } }, invoice_creation: { enabled: true } }
      : { subscription_data: { metadata: { supabase_user_id: user.id, tier: "auto" } } }),
  }, lifetime);
  if (!session.url) return { error: "checkout_failed" };
  // Mesure seulement : la relance « paiement pas finalisé » parle des prix
  // Premium, elle n'est pas programmée pour l'offre Auto.
  after(async () => {
    await createAdminClient()
      .from("user_events")
      .insert({ user_id: user.id, event_type: "checkout_opened", metadata: { plan: plan, welcome: false, promo: false, reminderEmailId: null } });
  });
  return { url: session.url };
}

async function logAutoUpgrade(userId: string, subscriptionId: string) {
  await createAdminClient().from("user_events").insert({ user_id: userId, event_type: "auto_plan_purchased", metadata: { subscriptionId, mode: "upgrade" } });
}
