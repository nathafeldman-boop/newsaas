import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";

export const maxDuration = 30;

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { matched, error } = await syncSubscriptionToProfile(subscription);
  // supabase-js ne throw jamais sur une erreur Postgres, et un update qui ne
  // matche aucune ligne (ex: stripe_customer_id pas encore posé sur le
  // profil au moment où l'event arrive) réussit silencieusement sans rien
  // modifier -- dans les deux cas, sans ce log, un paiement réel resterait
  // invisible sur le dashboard admin sans aucune trace pour comprendre
  // pourquoi (voir la même mésaventure avec la présence "en ligne"). Filet
  // de secours si malgré tout ce webhook échoue : /premium/success rejoue
  // la même synchro juste après le paiement (voir ce fichier).
  if (error) {
    console.error("Stripe webhook: syncSubscription update failed", error, { customerId });
  } else if (!matched) {
    console.error("Stripe webhook: syncSubscription matched no profile", { customerId });
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide : ${err instanceof Error ? err.message : "erreur inconnue"}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (userId && customerId) {
        const admin = createAdminClient();
        const { error } = await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId, premium_activated_at: new Date().toISOString() })
          .eq("id", userId);
        if (error) {
          console.error("Stripe webhook: checkout.session.completed profile update failed", error, {
            userId,
            customerId,
          });
        }
      } else {
        console.error("Stripe webhook: checkout.session.completed missing userId or customerId", {
          userId,
          customerId,
        });
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId && invoice.amount_paid > 0) {
        const admin = createAdminClient();
        const { error } = await admin.rpc("increment_total_paid", {
          p_stripe_customer_id: customerId,
          p_amount_cents: invoice.amount_paid,
        });
        if (error) {
          console.error("Stripe webhook: increment_total_paid failed", error, {
            customerId,
            amount: invoice.amount_paid,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
