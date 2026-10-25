"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { findScheduledEnd, keepSubscription } from "@/lib/stripe/keepPremium";

// Bouton « Garder mon Premium » : annule la résiliation programmée de
// l'abonnement du compte connecté (jamais celui d'un autre : l'abonnement
// est relu depuis son propre client Stripe).
export async function keepPremiumAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium/garder");

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  let ok = false;
  try {
    const end = await findScheduledEnd(profile?.stripe_customer_id ?? null, user.id);
    if (end) {
      await keepSubscription(end.subscriptionId);
      await logServerEvent(supabase, user.id, "subscription_kept", { subscriptionId: end.subscriptionId, endsAt: new Date(end.endsAt).toISOString() });
      ok = true;
    }
  } catch (err) {
    console.error("keepPremiumAction failed", err, { userId: user.id });
    redirect("/premium/garder?erreur=1");
  }
  redirect(ok ? "/premium/garder?ok=1" : "/premium/garder");
}
