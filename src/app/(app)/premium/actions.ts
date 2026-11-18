"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_AGE, ageOn } from "@/lib/schoolStage/levels";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { startCheckout } from "@/lib/stripe/startCheckout";
import { SITE_URL } from "@/lib/site";

export async function createCheckoutSessionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  // "plan" est posé par un input hidden dans chaque carte de prix (voir
  // /premium) ; tout le reste dans startCheckout (garde-fous, prix, session).
  // Moins de 15 ans (18/11) : la case « c'est un parent qui paie » doit être cochée.
  const { data: p } = await supabase.from("profiles").select("birth_date").eq("id", user.id).maybeSingle();
  if ((ageOn(p?.birth_date) ?? 99) < CONSENT_AGE && (await cookies()).get("parent_pays")?.value !== "1") redirect("/premium?error=parent");
  const result = await startCheckout({ id: user.id, email: user.email ?? null }, formData.get("plan"));
  if ("error" in result) redirect(`/premium?error=${result.error}`);
  redirect(result.url);
}

export async function createPortalSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect("/premium?error=no_subscription");
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/profil`,
  });

  redirect(session.url);
}
