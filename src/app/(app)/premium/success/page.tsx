import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Filet de secours : le webhook Stripe (/api/stripe/webhook) est la voie
// normale d'activation du Premium, mais un paiement réel s'est retrouvé sans
// aucun effet côté profil (ni statut, ni date d'activation) alors que le
// client avait bien payé -- webhook jamais arrivé ou signature refusée,
// aucun moyen de le confirmer depuis ce fichier. Plutôt que de dépendre
// uniquement d'un event asynchrone qu'on ne peut pas garantir, on
// resynchronise ici, à la volée, dès que l'utilisateur revient sur cette
// page après un paiement réussi -- Stripe garantit que la session de
// checkout est déjà "complete" et l'abonnement déjà créé à ce moment-là.
// Idempotent (voir syncSubscriptionToProfile) : sans risque si le webhook a
// entre-temps déjà fait le travail.
async function reconcileFromSession(sessionId: string, userId: string) {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.client_reference_id !== userId) {
      // session_id d'un autre utilisateur (lien partagé, onglet resté
      // ouvert...) : jamais appliquer un abonnement à la mauvaise personne.
      console.error("premium/success: session_id ne correspond pas à l'utilisateur connecté", {
        userId,
        sessionUserId: session.client_reference_id,
      });
      return;
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (customerId) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("premium_activated_at")
        .eq("id", userId)
        .maybeSingle();

      const { error } = await admin
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          // Ne jamais écraser une date d'activation déjà posée (ex: revisite
          // de cette page après un refresh) -- seulement la première fois.
          ...(profile && !profile.premium_activated_at
            ? { premium_activated_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", userId);
      if (error) {
        console.error("premium/success: profile update failed", error, { userId, customerId });
      }
    }

    const subscription = session.subscription as Stripe.Subscription | null;
    if (subscription) {
      const { matched, error } = await syncSubscriptionToProfile(subscription);
      if (error) {
        console.error("premium/success: syncSubscriptionToProfile failed", error, { userId });
      } else if (!matched) {
        console.error("premium/success: syncSubscriptionToProfile matched no profile", { userId });
      }
    }
  } catch (err) {
    // Ne jamais faire planter cette page pour cette resynchro best-effort :
    // le webhook reste la voie normale, ceci n'est qu'un filet de secours.
    console.error("premium/success: reconciliation threw", err);
  }
}

export default async function PremiumSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (session_id) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await reconcileFromSession(session_id, user.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-9">
      <p className="text-4xl">🎉</p>
      <h1 style={{ fontSize: 24, margin: "16px 0 0" }}>Bienvenue dans Premium</h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        Ton abonnement est actif. Swipes illimités et audit CV sont débloqués.
      </p>
      <Link href="/swipe" className="btn btn-primary">
        Retourner au swipe
      </Link>
    </div>
  );
}
