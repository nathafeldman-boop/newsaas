import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";

// « Garder mon Premium » (25/10, Nathan devant 28 résiliations programmées,
// 223,72 € de MRR à risque : « règle-moi tout ça »). Un abonné qui a
// résilié garde l'accès jusqu'à l'échéance ; s'il change d'avis, un clic
// annule la résiliation programmée : même prix, même échéance, rien n'est
// payé tout de suite. Ni prix ni droits modifiés, et le paiement reste
// celui de Stripe.

/** Événement noté à l'envoi du rappel (un seul par abonnement). */
export const KEEP_PREMIUM_EVENT = "keep_premium_reminder";

const LIVE = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

export type ScheduledEnd = {
  subscriptionId: string;
  /** Date de fin de l'accès (ms). */
  endsAt: number;
  amountCents: number;
  interval: string;
  intervalCount: number;
};

/** Fin programmée d'un abonnement encore en cours, ou null. */
function endOf(s: Stripe.Subscription): number | null {
  if (!LIVE.has(s.status)) return null;
  if (s.cancel_at) return s.cancel_at * 1000;
  const periodEnd = s.items.data[0]?.current_period_end;
  if (s.cancel_at_period_end && periodEnd) return periodEnd * 1000;
  return null;
}

/**
 * La résiliation programmée du client, s'il en a une. null si rien n'est
 * programmé, ou si un autre abonnement continue sans fin prévue (passage à
 * Stageio Auto, nouvel achat) : l'ancien s'arrête alors exprès, le garder
 * ferait payer deux fois.
 */
export async function findScheduledEnd(customerId: string | null, userId: string): Promise<ScheduledEnd | null> {
  if (!customerId) return null;
  const { data } = await getStripeClient().subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const live = data.filter((s) => LIVE.has(s.status) || s.status === "past_due");
  if (live.some((s) => endOf(s) === null)) return null;
  const sub = live.find((s) => endOf(s) !== null && (!s.metadata?.supabase_user_id || s.metadata.supabase_user_id === userId));
  if (!sub) return null;
  const item = sub.items.data[0];
  return {
    subscriptionId: sub.id,
    endsAt: endOf(sub)!,
    amountCents: sub.items.data.reduce((total, it) => total + (it.price.unit_amount ?? 0) * (it.quantity ?? 1), 0),
    interval: item?.price.recurring?.interval ?? "month",
    intervalCount: item?.price.recurring?.interval_count ?? 1,
  };
}

/** Annule la résiliation programmée (l'abonnement continue comme avant). */
export async function keepSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  let updated = sub.cancel_at_period_end ? await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false }) : sub;
  // Fin à une date précise (cancel_at) plutôt qu'« à l'échéance ».
  if (updated.cancel_at) updated = await stripe.subscriptions.update(subscriptionId, { cancel_at: "" });
  if (updated.cancel_at || updated.cancel_at_period_end) throw new Error(`keepSubscription: résiliation toujours programmée sur ${subscriptionId}`);
}

/** « 7,99 €/mois », « 3,50 €/semaine »… */
export function priceLabel(end: Pick<ScheduledEnd, "amountCents" | "interval" | "intervalCount">): string {
  const euros = (end.amountCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const unit = { day: "jour", week: "semaine", month: "mois", year: "an" }[end.interval] ?? end.interval;
  return end.intervalCount > 1 ? `${euros} € tous les ${end.intervalCount} ${unit === "mois" ? "mois" : `${unit}s`}` : `${euros} €/${unit}`;
}

/** « mardi 12 novembre » (heure de Paris). */
export function endDateLabel(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}
