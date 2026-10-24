import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";
import { creditCheckoutPayment, creditInvoicePayment } from "@/lib/stripe/creditInvoicePayment";
import { creditAffiliateCommission } from "@/lib/affiliates/creditAffiliateCommission";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAutoCheckout } from "@/lib/stripe/autoPlan";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import type Stripe from "stripe";

// Filet de secours : le webhook Stripe (/api/stripe/webhook) est la voie
// normale d'activation du Premium, mais plusieurs paiements réels se sont
// retrouvés sans aucun effet côté profil (statut, date d'activation, ET
// revenu suivi -- total_paid_cents restait à 0 malgré 3+ paiements réels
// confirmés) -- webhook jamais arrivé ou signature refusée, aucun moyen de
// le confirmer depuis ce fichier. Plutôt que de dépendre uniquement d'un
// event asynchrone qu'on ne peut pas garantir, on resynchronise ici, à la
// volée, dès que l'utilisateur revient sur cette page après un paiement
// réussi -- Stripe garantit que la session de checkout est déjà "complete"
// et l'abonnement (+ sa première facture) déjà créés à ce moment-là.
// Idempotent (voir syncSubscriptionToProfile et creditInvoicePayment) :
// sans risque si le webhook a entre-temps déjà fait le travail, dans un
// sens comme dans l'autre.
async function reconcileFromSession(sessionId: string, userId: string) {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "invoice"],
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
    // mode "payment" = achat à vie (voir premium/actions.ts) : pas de
    // subscription Stripe à synchroniser plus bas, on pose directement le
    // statut ici -- même distinction que dans le webhook
    // (checkout.session.completed).
    const isLifetimePurchase = session.mode === "payment";
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
          ...(isLifetimePurchase ? { subscription_status: "lifetime" } : {}),
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

    await applyAutoCheckout(session, userId);

    if (isLifetimePurchase && customerId) {
      const { error } = await creditCheckoutPayment(session, customerId);
      if (error) console.error("premium/success: lifetime payment credit failed", error, { userId });
    }

    const invoice = session.invoice as Stripe.Invoice | null;
    if (invoice && customerId && invoice.amount_paid > 0) {
      const { credited, error } = await creditInvoicePayment(invoice.id, customerId, invoice.amount_paid);
      if (error) {
        console.error("premium/success: creditInvoicePayment failed", error, {
          userId,
          invoiceId: invoice.id,
        });
      } else if (!credited) {
        // Ne devrait normalement jamais arriver ici : stripe_customer_id
        // vient d'être posé plus haut dans cette même fonction, avant cet
        // appel. Si ça arrive quand même, ça mérite d'être visible plutôt
        // que traité comme un succès silencieux (voir migration
        // 20260913000000).
        console.error("premium/success: creditInvoicePayment found no matching profile", {
          userId,
          invoiceId: invoice.id,
        });
      } else {
        const { error: commissionError } = await creditAffiliateCommission(invoice, customerId);
        if (commissionError) {
          console.error("premium/success: creditAffiliateCommission failed", commissionError, {
            userId,
            invoiceId: invoice.id,
          });
        }
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
  searchParams: Promise<{ session_id?: string; auto?: string }>;
}) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (session_id && user) {
    await reconcileFromSession(session_id, user.id);
  }
  // Formule Auto (24/10) : message et premier pas propres à l'envoi au like.
  const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null };
  const auto = isAutoTier(profile);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-9">
      <p className="text-4xl">🎉</p>
      <h1 style={{ fontSize: 24, margin: "16px 0 0" }}>{auto ? "Bienvenue dans Stageio Auto" : "Bienvenue dans Premium"}</h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        {auto
          ? `Tu peux maintenant postuler tout seul : chaque like envoie ta candidature, jusqu'à ${AUTO_DAILY_LIMIT} par jour. Vérifie ton CV (onglet CV) et ton téléphone (profil) : ils partent avec chaque candidature. Les réponses arriveront dans ta boîte.`
          : "Ton accès Premium est actif. Like, candidatures illimitées et audit CV sont débloqués."}
      </p>
      <Link href="/swipe" className="btn btn-primary">
        {auto ? "Swiper et postuler" : "Retourner au swipe"}
      </Link>
      {auto && (
        <Link href="/profil" className="btn btn-ghost" style={{ marginTop: 8 }}>
          Compléter mon CV et mon téléphone
        </Link>
      )}
    </div>
  );
}
