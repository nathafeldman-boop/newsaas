"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { SITE_URL } from "@/lib/site";

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

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createCheckoutSessionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

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
    redirect("/premium?error=already_subscribed");
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
  const plan = formData.get("plan");
  if (plan === "daily" || plan === "weekly") {
    redirect("/premium?error=not_configured");
  }
  const isLifetime = plan === "lifetime";
  const rawPriceId = isLifetime ? process.env.STRIPE_PRICE_ID_LIFETIME : process.env.STRIPE_PRICE_ID;
  // .trim() : Stripe rejette un ID avec un espace superflu ("No such
  // price") sans distinguer ça d'un ID réellement invalide -- un simple
  // copier-coller depuis le dashboard Stripe vers Vercel embarque parfois
  // un espace en fin de valeur, invisible dans l'interface. Coûte rien de
  // s'en protéger ici plutôt que de dépendre d'une variable d'env toujours
  // parfaitement propre.
  const priceId = rawPriceId?.trim() || undefined;
  if (!priceId) {
    redirect("/premium?error=not_configured");
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email ?? null);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
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
    cancel_url: `${SITE_URL}/premium`,
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
  });

  if (!session.url) redirect("/premium?error=checkout_failed");
  redirect(session.url);
}

export async function createPortalSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect("/premium?error=no_subscription");
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/profil`,
  });

  redirect(session.url);
}
