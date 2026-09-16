import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { creditInvoicePayment } from "@/lib/stripe/creditInvoicePayment";
import { notifyIncompletePaymentByCustomerId } from "@/lib/stripe/notifyIncompletePayment";

export const maxDuration = 30;

async function syncSubscription(subscription: Stripe.Subscription): Promise<{ ok: boolean }> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { matched, error } = await syncSubscriptionToProfile(subscription);
  // supabase-js ne throw jamais sur une erreur Postgres, et un update qui ne
  // matche aucune ligne (ex: stripe_customer_id pas encore posé sur le
  // profil au moment où l'event arrive -- customer.subscription.updated est
  // un event À PART de checkout.session.completed, livré sans garantie
  // d'ordre entre les deux, exactement le même piège que invoice.paid déjà
  // corrigé) réussit silencieusement sans rien modifier -- dans les deux
  // cas, sans ce log, un paiement réel resterait invisible sur le dashboard
  // admin sans aucune trace pour comprendre pourquoi (voir la même
  // mésaventure avec la présence "en ligne"). Le filet de secours
  // /premium/success ne couvre que les visiteurs qui atteignent cette page
  // (onglet fermé juste après paiement = aucun filet) -- ça ne suffit pas à
  // soi seul, d'où le retry ci-dessous.
  if (error) {
    console.error("Stripe webhook: syncSubscription update failed", error, { customerId });
    return { ok: false };
  }
  if (!matched) {
    console.error("Stripe webhook: syncSubscription matched no profile", { customerId });
    return { ok: false };
  }

  // Abonnement bloqué en 'incomplete' (3D Secure jamais confirmé, carte
  // refusée au premier essai...) : le client n'est jamais devenu Premium et
  // ne le saura pas tout seul -- on le relance dès qu'on voit ce statut,
  // sans attendre un cron (idempotent, voir notifyIncompletePaymentOnce).
  if (subscription.status === "incomplete") {
    const { error: notifyError } = await notifyIncompletePaymentByCustomerId(customerId);
    if (notifyError) {
      console.error("Stripe webhook: notifyIncompletePayment failed", notifyError, { customerId });
    }
  }

  return { ok: true };
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
        const { ok } = await syncSubscription(subscription);
        if (!ok) {
          return NextResponse.json({ error: "Profil pas encore lié, réessaie plus tard." }, { status: 409 });
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // customer.subscription.* est livré par Stripe comme un event à part
      // entière, sans aucune garantie d'ordre par rapport à
      // checkout.session.completed (même event différent, même paiement) --
      // s'il arrive en premier, stripe_customer_id n'est pas encore posé sur
      // le profil et l'update ne matche rien. Répondre autre chose que 200
      // déclenche le retry automatique de Stripe (jusqu'à 3 jours, avec
      // backoff) le temps que checkout.session.completed fasse son travail,
      // au lieu de perdre le vrai statut d'abonnement en silence -- même
      // correctif que celui déjà appliqué à invoice.paid pour la même
      // course, qui avait laissé des clients payants comptés "gratuits".
      const subscription = event.data.object as Stripe.Subscription;
      const { ok } = await syncSubscription(subscription);
      if (!ok) {
        return NextResponse.json({ error: "Profil pas encore lié, réessaie plus tard." }, { status: 409 });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId && invoice.amount_paid > 0) {
        const { credited, error } = await creditInvoicePayment(
          invoice.id,
          customerId,
          invoice.amount_paid,
        );
        if (error) {
          console.error("Stripe webhook: creditInvoicePayment failed", error, {
            customerId,
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
          });
        } else if (!credited) {
          // Aucun profil ne correspond encore à ce stripe_customer_id --
          // arrive quand "invoice.paid" est livré avant "checkout.session.
          // completed" (Stripe ne garantit pas l'ordre). Répondre autre
          // chose que 200 déclenche le retry automatique de Stripe (jusqu'à
          // 3 jours, avec backoff) au lieu de perdre ce paiement en
          // silence -- voir la migration 20260913000000 pour le détail du
          // bug que ça corrige.
          console.error("Stripe webhook: creditInvoicePayment found no matching profile yet", {
            customerId,
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
          });
          return NextResponse.json({ error: "Profil pas encore lié, réessaie plus tard." }, { status: 409 });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
