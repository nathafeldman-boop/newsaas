import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function periodEndOf(subscription: Stripe.Subscription): string | null {
  const ts = subscription.items.data[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
}

// Lu directement sur le prix Stripe de l'abonnement plutôt que recopié
// depuis une constante côté app : reste exact même si un prix change ou
// si une nouvelle cadence est ajoutée plus tard (voir ARR sur /admin).
function priceInfoOf(subscription: Stripe.Subscription): {
  priceCents: number | null;
  interval: string | null;
} {
  const price = subscription.items.data[0]?.price;
  return {
    priceCents: typeof price?.unit_amount === "number" ? price.unit_amount : null,
    interval: price?.recurring?.interval ?? null,
  };
}

/**
 * Recopie le statut d'un abonnement Stripe sur le profil correspondant
 * (matché par stripe_customer_id). Partagé entre le webhook (source
 * normale) et /premium/success (filet de secours si le webhook n'est
 * jamais arrivé ou a échoué -- voir ce fichier pour le contexte complet) :
 * volontairement idempotent (un UPDATE qui pose les mêmes valeurs), donc
 * sans risque à rejouer plusieurs fois pour le même abonnement.
 */
export async function syncSubscriptionToProfile(
  subscription: Stripe.Subscription,
): Promise<{ matched: boolean; error?: string }> {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  // Écriture critique isolée à part : stripe_subscription_id/
  // subscription_status/current_period_end sont ce qui active réellement
  // le Premium (isPremium() ne lit que subscription_status) -- ça ne doit
  // JAMAIS pouvoir échouer à cause d'une colonne annexe qui n'existerait
  // pas encore en base. C'est très exactement ce qui s'est produit en
  // prod : un paiement réel confirmé côté Stripe, mais subscription_status
  // resté à son ancienne valeur parce que ce même UPDATE incluait aussi
  // subscription_price_cents/subscription_interval (ajoutés pour l'ARR de
  // /admin) avant que la migration correspondante ne soit collée en base
  // -- un UPDATE avec une colonne inconnue échoue en bloc côté Postgres,
  // pas juste sur le champ fautif.
  const { error, count } = await admin
    .from("profiles")
    .update(
      {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: periodEndOf(subscription),
      },
      { count: "exact" },
    )
    .eq("stripe_customer_id", customerId);

  if (error) return { matched: false, error: error.message };
  const matched = (count ?? 0) > 0;

  // Best-effort, à part : sert uniquement à affiner l'ARR affiché sur
  // /admin (voir src/app/admin/page.tsx) -- un échec ici (colonnes pas
  // encore migrées, ou tout autre souci) ne doit jamais remettre en cause
  // l'activation Premium elle-même, déjà actée ci-dessus.
  if (matched) {
    const { priceCents, interval } = priceInfoOf(subscription);
    const { error: pricingError } = await admin
      .from("profiles")
      .update({ subscription_price_cents: priceCents, subscription_interval: interval })
      .eq("stripe_customer_id", customerId);
    if (pricingError) {
      console.error("syncSubscriptionToProfile: pricing update failed (non-bloquant)", pricingError, {
        customerId,
      });
    }
  }

  return { matched };
}
