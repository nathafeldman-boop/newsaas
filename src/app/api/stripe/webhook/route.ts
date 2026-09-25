import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { creditInvoicePayment } from "@/lib/stripe/creditInvoicePayment";
import { notifyIncompletePaymentByCustomerId } from "@/lib/stripe/notifyIncompletePayment";
import { creditAffiliateCommission } from "@/lib/affiliates/creditAffiliateCommission";

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

  // Abonnement bloqué en 'incomplete' (première facture jamais confirmée :
  // 3D Secure pas complété, carte refusée au premier essai...) OU en
  // 'past_due' (un RENOUVELLEMENT a échoué sur un abonnement déjà actif
  // jusque-là -- même cause possible, 3D Secure côté banque exigé sur un
  // prélèvement hors session) : dans les deux cas le client perd l'accès
  // Premium sans le savoir tout seul. Avant ce correctif, seul 'incomplete'
  // déclenchait une relance -- un renouvellement en échec ('past_due')
  // n'envoyait STRICTEMENT AUCUNE notification, ni au client ni à personne
  // d'autre : la personne perdait juste son accès en silence. Bug réel
  // trouvé le 2026-09-25 suite à un pic de renouvellements en échec
  // signalé par Nathan (voir RETENTION_AUDIT.md). Idempotent (voir
  // notifyIncompletePaymentOnce), donc sans risque de doublon si le
  // statut oscille entre les deux avant d'être résolu.
  if (subscription.status === "incomplete" || subscription.status === "past_due") {
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
        } else {
          // Stripe réessaie tout l'event si syncSubscription renvoie 409
          // plus bas (ligne ~111) -- sans ce garde-fou, un même
          // abonnement pouvait logger plusieurs "subscription_started"
          // (compteur analytics gonflé, jamais un souci de facturation/
          // accès). Best-effort, comme le reste de ce webhook : une
          // erreur ici ne doit jamais faire échouer l'activation réelle.
          const { data: alreadyLogged } = await admin
            .from("user_events")
            .select("id")
            .eq("user_id", userId)
            .eq("event_type", "subscription_started")
            .contains("metadata", { customerId })
            .limit(1)
            .maybeSingle();
          if (!alreadyLogged) {
            const { error: eventError } = await admin
              .from("user_events")
              .insert({ user_id: userId, event_type: "subscription_started", metadata: { customerId } });
            if (eventError) {
              console.error("Stripe webhook: subscription_started event insert failed", eventError, { userId });
            }
          }
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
        } else {
          // N'appelé que si creditInvoicePayment a bien matché un profil --
          // hérite donc gratuitement de la protection contre la course
          // ci-dessus (jamais appelé avant que stripe_customer_id soit posé).
          const { error: commissionError } = await creditAffiliateCommission(invoice, customerId);
          if (commissionError) {
            console.error("Stripe webhook: creditAffiliateCommission failed", commissionError, {
              customerId,
              invoiceId: invoice.id,
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
