import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { AUTO_PRICE_IDS } from "@/lib/pricing/plans";

export function periodEndOf(subscription: Stripe.Subscription): string | null {
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
  // le Premium (isPremium() lit subscription_status et current_period_end) -- ça ne doit
  // JAMAIS pouvoir échouer à cause d'une colonne annexe qui n'existerait
  // pas encore en base. C'est très exactement ce qui s'est produit en
  // prod : un paiement réel confirmé côté Stripe, mais subscription_status
  // resté à son ancienne valeur parce que ce même UPDATE incluait aussi
  // subscription_price_cents/subscription_interval (ajoutés pour l'ARR de
  // /admin) avant que la migration correspondante ne soit collée en base
  // -- un UPDATE avec une colonne inconnue échoue en bloc côté Postgres,
  // pas juste sur le champ fautif.
  // incomplete_payment_reminder_sent_at est un flag "envoyé une fois pour
  // toutes" (voir notifyIncompletePaymentOnce) -- sans le réinitialiser ici,
  // quelqu'un dont un PREMIER souci de paiement a été résolu ne recevrait
  // plus jamais d'email si un renouvellement ULTÉRIEUR échouait à son tour
  // (webhook déjà idempotent dessus, donc silencieux). Remis à zéro dès que
  // l'abonnement redevient actif/trialing, pour qu'un futur souci déclenche
  // une nouvelle relance.
  const isHealthy = subscription.status === "active" || subscription.status === "trialing";

  // Accès à vie ou offert : un abonnement mensuel annulé ou impayé (souvent
  // l'ancien abonnement d'un compte passé ensuite à l'accès à vie) ne doit
  // jamais leur retirer Premium. Avant le 14/10, l'événement
  // customer.subscription.deleted de cet ancien abonnement écrasait
  // "lifetime" par "canceled".
  const { data: keepers } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .in("subscription_status", ["lifetime", "comp"]);
  const keeperIds = (keepers ?? []).map((k) => k.id);

  // Formule Auto (24/10), à part et best-effort (colonne premium_tier du SQL
  // du 24/10) : posée avant le retour anticipé des comptes à vie, qui
  // peuvent prendre l'abonnement Auto en plus.
  await syncAutoTier(admin, customerId, subscription, isHealthy, keeperIds.length > 0);

  let update = admin
    .from("profiles")
    .update(
      {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: periodEndOf(subscription),
        ...(isHealthy ? { incomplete_payment_reminder_sent_at: null } : {}),
      },
      { count: "exact" },
    )
    .eq("stripe_customer_id", customerId);
  if (keeperIds.length > 0) update = update.not("id", "in", `(${keeperIds.join(",")})`);
  const { error, count } = await update;
  if (error) return { matched: false, error: error.message };
  const matched = (count ?? 0) > 0 || keeperIds.length > 0;
  if (keeperIds.length > 0 && (count ?? 0) === 0) return { matched };

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

/**
 * premium_tier selon l'abonnement : "auto" tant qu'un abonnement au prix
 * Auto est sain, retiré sinon. Un abonnement Premium classique ne retire
 * "auto" que pour un compte sans accès à vie (son seul abonnement est
 * repassé au prix Premium). "auto_lifetime" n'est jamais touché.
 */
async function syncAutoTier(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
  subscription: Stripe.Subscription,
  isHealthy: boolean,
  isKeeper: boolean,
) {
  const isAuto = subscription.items.data.some((item) => item.price?.id === AUTO_PRICE_IDS.monthly);
  if (!isAuto && isKeeper) return;
  const next = isAuto && isHealthy ? "auto" : null;
  let query = admin.from("profiles").update({ premium_tier: next }).eq("stripe_customer_id", customerId).or("premium_tier.is.null,premium_tier.eq.auto");
  if (!isAuto) query = query.eq("premium_tier", "auto");
  const { error } = await query;
  if (error && !/premium_tier/.test(error.message)) console.error("syncSubscriptionToProfile: premium_tier non mis à jour", error.message, { customerId });
}
