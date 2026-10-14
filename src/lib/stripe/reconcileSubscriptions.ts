import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";

export type ReconcileResult =
  | { ok: true; checked: number; resynced: number; failed: number }
  | { ok: false };

// Remet chaque compte lié à Stripe sur le vrai statut de son abonnement
// (annulé, impayé, actif). Utilisé par le bouton de /admin/premium et, depuis
// le 14/10, chaque nuit par /api/cron/reconcile-subscriptions (demande de
// Nathan : ne plus avoir à cliquer). Les accès à vie et les codes offerts ne
// bougent pas (voir syncSubscriptionToProfile). Sans risque à relancer.
export async function reconcileAllSubscriptions(source: string): Promise<ReconcileResult> {
  const admin = createAdminClient();
  const stripe = getStripeClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .not("stripe_customer_id", "is", null)
    .order("id")
    .limit(5000);

  if (profilesError) {
    console.error(`${source}: query failed`, profilesError);
    return { ok: false };
  }

  let checked = 0;
  let resynced = 0;
  let failed = 0;

  // 10 clients Stripe à la fois : un par un, quelques centaines de clients
  // dépassaient le délai de la page.
  const customerIds = [
    ...new Set((profiles ?? []).map((p) => p.stripe_customer_id).filter((id): id is string => !!id)),
  ];
  for (let i = 0; i < customerIds.length; i += 10) {
    await Promise.all(
      customerIds.slice(i, i + 10).map(async (customerId) => {
        try {
          // Le plus récent créé = l'abonnement qui doit faire foi aujourd'hui
          // (list() trie par created desc côté Stripe) -- un client n'a en
          // pratique qu'un seul abonnement Premium à la fois sur ce produit.
          // status "all" : sans lui, Stripe ne renvoie que les abonnements NON
          // annulés -- un abonnement annulé à la main dans Stripe (renouvellement
          // en échec) n'était jamais retrouvé ici et le profil restait "active"
          // pour toujours (corrigé le 14/10).
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1, status: "all" });
          const subscription = subscriptions.data[0];
          if (!subscription) return;
          checked += 1;

          const { matched, error } = await syncSubscriptionToProfile(subscription);
          if (error) {
            console.error(`${source}: sync failed`, error, { customerId });
          } else if (matched) {
            resynced += 1;
          }
        } catch (stripeError) {
          failed += 1;
          console.error(`${source}: Stripe fetch failed`, stripeError, { customerId });
        }
      }),
    );
  }

  console.log(`${source}: ${checked} client(s) vérifié(s), ${resynced} resynchronisé(s), ${failed} en échec`);
  return { ok: true, checked, resynced, failed };
}
