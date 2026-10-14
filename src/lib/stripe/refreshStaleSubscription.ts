import { getStripeClient } from "@/lib/stripe/client";
import { periodEndOf, syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { isSubscriptionPeriodOver } from "@/lib/subscription/isPremium";
import type { Profile } from "@/types/database";

type SubscriptionFields = Pick<Profile, "subscription_status" | "current_period_end" | "stripe_subscription_id">;

// Abonnement marqué actif mais dont la période payée est finie depuis plus
// d'un jour : soit le renouvellement a été payé et l'événement Stripe ne
// nous est pas arrivé, soit il a échoué ou l'abonnement a été annulé sans
// qu'on le sache. On redemande à Stripe avant de décider, une seule fois
// (le profil est mis à jour, la période suivante n'est plus « finie »).
// Si Stripe ne répond pas, le profil reste tel quel et isPremium() coupe
// l'accès : un abonné qui a vraiment payé le retrouve au prochain passage.
export async function refreshStaleSubscription<T extends SubscriptionFields>(profile: T): Promise<T> {
  const status = profile.subscription_status;
  if (status !== "active" && status !== "trialing") return profile;
  if (!profile.stripe_subscription_id || !isSubscriptionPeriodOver(profile)) return profile;

  try {
    const subscription = await getStripeClient().subscriptions.retrieve(profile.stripe_subscription_id);
    const { error } = await syncSubscriptionToProfile(subscription);
    if (error) console.error("refreshStaleSubscription: sync failed", error);
    return { ...profile, subscription_status: subscription.status, current_period_end: periodEndOf(subscription) };
  } catch (err) {
    console.error("refreshStaleSubscription: Stripe injoignable", err, {
      subscriptionId: profile.stripe_subscription_id,
    });
    return profile;
  }
}
