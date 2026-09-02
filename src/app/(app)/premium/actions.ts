"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { SITE_URL } from "@/lib/site";

async function getOrCreateStripeCustomer(userId: string, email: string | null) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createCheckoutSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    redirect("/premium?error=not_configured");
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email ?? null);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/premium/success`,
    cancel_url: `${SITE_URL}/premium`,
    client_reference_id: user.id,
    subscription_data: { metadata: { supabase_user_id: user.id } },
  });

  if (!session.url) redirect("/premium?error=checkout_failed");
  redirect(session.url);
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
