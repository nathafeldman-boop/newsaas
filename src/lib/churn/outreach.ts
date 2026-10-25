import { createAdminClient } from "@/lib/supabase/admin";
import { buildChurnMessage, sendChurnMessage } from "@/lib/resend/churnMessage";
import { KEEP_PREMIUM_EVENT, endDateLabel, findScheduledEnd, priceLabel } from "@/lib/stripe/keepPremium";

// Envoi des messages aux abonnés qui partent (voir lib/resend/churnMessage.ts).
// Une seule fois par abonnement (programmé) ou par compte (parti), noté dans
// user_events ; chaque résiliation est relue dans Stripe juste avant.

export const WINBACK_EVENT = "churn_winback_email";

type Db = ReturnType<typeof createAdminClient>;
export type OutreachProfile = { id: string; email: string | null; full_name: string | null; stripe_customer_id: string | null };

/** Résiliation programmée : envoie le message si ce n'est pas déjà fait pour cet abonnement. */
export async function sendScheduledMessageOnce(db: Db, profile: OutreachProfile, fallbackCustomer?: string): Promise<"sent" | "skipped"> {
  if (!profile.email) return "skipped";
  const end = await findScheduledEnd(profile.stripe_customer_id ?? fallbackCustomer ?? null, profile.id);
  if (!end || end.endsAt <= Date.now()) return "skipped";
  const { data: already } = await db
    .from("user_events")
    .select("id")
    .eq("user_id", profile.id)
    .eq("event_type", KEEP_PREMIUM_EVENT)
    .contains("metadata", { subscriptionId: end.subscriptionId })
    .limit(1)
    .maybeSingle();
  if (already) return "skipped";
  const message = buildChurnMessage({ kind: "programme", profileId: profile.id, fullName: profile.full_name, dateLabel: endDateLabel(end.endsAt), price: priceLabel(end) });
  await sendChurnMessage(profile.email, message, profile.id);
  await db.from("user_events").insert({ user_id: profile.id, event_type: KEEP_PREMIUM_EVENT, metadata: { subscriptionId: end.subscriptionId, endsAt: new Date(end.endsAt).toISOString() } });
  return "sent";
}

/**
 * Appelé par le webhook Stripe quand une résiliation vient d'être programmée.
 * Jamais bloquant : une erreur est notée, le webhook continue.
 */
export async function onCancellationScheduled(customerId: string): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("id, email, full_name, stripe_customer_id").eq("stripe_customer_id", customerId).maybeSingle();
    if (profile) await sendScheduledMessageOnce(db, profile);
  } catch (err) {
    console.error("onCancellationScheduled: message non envoyé", err, { customerId });
  }
}

/** Abonnement terminé : un message par compte, jamais deux. */
export async function sendWinbackMessageOnce(db: Db, profile: OutreachProfile, endedAt: number, subscriptionId: string): Promise<"sent" | "skipped"> {
  if (!profile.email) return "skipped";
  const { data: already } = await db.from("user_events").select("id").eq("user_id", profile.id).eq("event_type", WINBACK_EVENT).limit(1).maybeSingle();
  if (already) return "skipped";
  const message = buildChurnMessage({ kind: "parti", profileId: profile.id, fullName: profile.full_name, dateLabel: endDateLabel(endedAt) });
  await sendChurnMessage(profile.email, message, profile.id);
  await db.from("user_events").insert({ user_id: profile.id, event_type: WINBACK_EVENT, metadata: { subscriptionId, endedAt: new Date(endedAt).toISOString() } });
  return "sent";
}
