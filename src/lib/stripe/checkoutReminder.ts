import { createAdminClient } from "@/lib/supabase/admin";
import { cancelCheckoutReminders, scheduleCheckoutReminder } from "@/lib/resend/notifyCheckoutAbandoned";

// Relances « paiement pas finalisé » rangées dans l'événement checkout_opened
// (metadata.reminderEmailId) : une seule relance en attente par personne
// (la précédente est annulée à chaque nouvelle ouverture du paiement), et
// toutes annulées dès que le paiement aboutit (webhook Stripe).

async function pendingReminderIds(userId: string): Promise<string[]> {
  const { data } = await createAdminClient()
    .from("user_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("event_type", "checkout_opened")
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(20);
  return (data ?? [])
    .map((e) => (e.metadata as Record<string, unknown> | null)?.reminderEmailId)
    .filter((id): id is string => typeof id === "string");
}

export async function recordCheckoutOpened(params: {
  userId: string;
  email: string | null;
  checkoutUrl: string;
  lifetime: boolean;
  welcome: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  let reminderEmailId: string | null = null;
  if (params.email) {
    const { data: profile } = await admin.from("profiles").select("full_name, notify_new_offers").eq("id", params.userId).maybeSingle();
    // Désabonné des e-mails (lien de désinscription) : aucune relance.
    if (profile?.notify_new_offers !== false) {
      await cancelCheckoutReminders(await pendingReminderIds(params.userId));
      reminderEmailId = await scheduleCheckoutReminder({
        email: params.email,
        fullName: profile?.full_name ?? null,
        profileId: params.userId,
        checkoutUrl: params.checkoutUrl,
        lifetime: params.lifetime,
      }).catch((err) => {
        console.error("recordCheckoutOpened: reminder scheduling failed", err);
        return null;
      });
    }
  }
  const { error } = await admin.from("user_events").insert({
    user_id: params.userId,
    event_type: "checkout_opened",
    metadata: { plan: params.lifetime ? "lifetime" : "monthly", welcome: params.welcome, reminderEmailId },
  });
  if (error) console.error("recordCheckoutOpened: event insert failed", error);
}

export async function cancelRemindersAfterPayment(userId: string): Promise<void> {
  await cancelCheckoutReminders(await pendingReminderIds(userId)).catch((err) =>
    console.error("cancelRemindersAfterPayment failed", err),
  );
}
