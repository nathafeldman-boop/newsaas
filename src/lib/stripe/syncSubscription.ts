import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function periodEndOf(subscription: Stripe.Subscription): string | null {
  const ts = subscription.items.data[0]?.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
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
  return { matched: (count ?? 0) > 0 };
}
