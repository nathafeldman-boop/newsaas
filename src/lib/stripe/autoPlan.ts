import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

// Achat de la formule Auto (24/10), commun au webhook Stripe et à
// /premium/success (filet de secours) : idempotent.
// - accès à vie Auto (paiement unique) : premium_tier = "auto_lifetime" ;
// - abonnement Auto : premium_tier posé par syncSubscriptionToProfile ;
// - un abonnement Premium mensuel en cours (replace_subscription) est arrêté
//   en fin de période : l'étudiant ne paie pas deux formules.
export async function applyAutoCheckout(session: Stripe.Checkout.Session, userId: string): Promise<void> {
  if (session.metadata?.tier !== "auto") return;
  const admin = createAdminClient();

  if (session.mode === "payment" && session.payment_status === "paid") {
    const { error } = await admin.from("profiles").update({ premium_tier: "auto_lifetime" }).eq("id", userId);
    if (error) console.error("autoPlan: premium_tier à vie non enregistré", error.message, { userId });
  }

  const replace = session.metadata?.replace_subscription;
  if (replace && session.status === "complete") {
    try {
      const old = await getStripeClient().subscriptions.retrieve(replace);
      if ((old.status === "active" || old.status === "trialing") && !old.cancel_at_period_end) {
        await getStripeClient().subscriptions.update(replace, { cancel_at_period_end: true });
      }
    } catch (err) {
      console.error("autoPlan: ancien abonnement non arrêté", err instanceof Error ? err.message : err, { userId, replace });
    }
  }

  const { data: logged } = await admin
    .from("user_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "auto_plan_purchased")
    .contains("metadata", { sessionId: session.id })
    .limit(1);
  if (!logged?.length) {
    await admin.from("user_events").insert({ user_id: userId, event_type: "auto_plan_purchased", metadata: { sessionId: session.id, mode: session.mode } });
  }
}
