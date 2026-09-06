import { createAdminClient } from "@/lib/supabase/admin";
import { notifyIncompletePayment as sendEmail } from "@/lib/resend/notifyIncompletePayment";

// Partagé entre le webhook Stripe (déclenchement automatique dès qu'un
// abonnement passe en statut 'incomplete') et une action admin manuelle
// (pour relancer immédiatement un cas repéré à la main dans le dashboard
// Stripe, sans attendre un nouvel événement) -- idempotent via
// incomplete_payment_reminder_sent_at, pour ne jamais envoyer ce mail deux
// fois au même compte quel que soit le chemin qui déclenche l'envoi.
export async function notifyIncompletePaymentOnce(
  profileId: string,
): Promise<{ sent: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, incomplete_payment_reminder_sent_at")
    .eq("id", profileId)
    .single();

  if (!profile?.email) return { sent: false, error: "profil introuvable ou sans email" };
  if (profile.incomplete_payment_reminder_sent_at) return { sent: false };

  await sendEmail(profile.email, profile.full_name);

  const { error } = await admin
    .from("profiles")
    .update({ incomplete_payment_reminder_sent_at: new Date().toISOString() })
    .eq("id", profileId);

  return error ? { sent: true, error: error.message } : { sent: true };
}

export async function notifyIncompletePaymentByCustomerId(
  customerId: string,
): Promise<{ sent: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return { sent: false, error: "aucun profil pour ce customer Stripe" };
  return notifyIncompletePaymentOnce(profile.id);
}
