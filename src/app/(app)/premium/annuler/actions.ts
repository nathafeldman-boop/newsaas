"use server";

import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createPortalSessionAction } from "@/app/(app)/premium/actions";

// Feedback court, jamais bloquant (RETENTION_AUDIT.md, section 20) :
// qu'il réponde ou clique "Passer", l'utilisateur atteint toujours le vrai
// portail Stripe -- cette page ne fait jamais office de confirmation
// d'annulation, elle ne fait que précéder le vrai bouton "Annuler mon
// abonnement" qui vit dans le portail Stripe lui-même.
export async function submitCancellationFeedbackAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const reason = String(formData.get("reason") ?? "").trim();
    const detail = String(formData.get("detail") ?? "").trim();

    if (reason) {
      const { error } = await supabase
        .from("subscription_cancellations")
        .insert({ user_id: user.id, reason, detail: detail || null });
      if (error) {
        console.error("submitCancellationFeedbackAction insert failed", error, { userId: user.id });
      } else {
        await logServerEvent(supabase, user.id, "subscription_cancellation_feedback", { reason });
      }
    }
  }

  await createPortalSessionAction();
}
