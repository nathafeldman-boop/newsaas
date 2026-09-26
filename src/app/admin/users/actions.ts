"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPremiumFixed } from "@/lib/resend/notifyPremiumFixed";
import { notifyIncompletePaymentOnce } from "@/lib/stripe/notifyIncompletePayment";
import { getStripeClient } from "@/lib/stripe/client";
import { creditInvoicePayment } from "@/lib/stripe/creditInvoicePayment";
import { syncSubscriptionToProfile } from "@/lib/stripe/syncSubscription";

// Pas de "export const maxDuration" ici : un fichier "use server" ne peut
// exporter que des fonctions serveur (async), pas de config de route -- ça
// casse silencieusement TOUT le module ("no exports at all") si on essaie.
// reconcileAllInvoicesAction reste dans le budget par défaut d'une Server
// Action grâce au faible nombre de clients Stripe connus (dizaines, pas
// milliers).

// Recours manuel pour exactement le scénario rencontré en prod : un client a
// payé (Stripe l'a bien débité) mais l'activation Premium n'a pas suivi
// (webhook jamais arrivé/échoué, et le compte a été créé avant le filet de
// secours ajouté dans /premium/success). Corrige le statut sans attendre un
// nouvel event Stripe, et prévient la personne -- elle a payé pour rien
// pendant un moment, elle mérite un mot, pas juste un accès qui réapparaît
// en silence.
export async function grantPremiumAndNotifyAction(formData: FormData) {
  await assertAdminSession();
  const userId = formData.get("userId") as string;
  if (!userId) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, premium_activated_at")
    .eq("id", userId)
    .single();

  if (!profile?.email) return;

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      premium_activated_at: profile.premium_activated_at ?? new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("grantPremiumAndNotifyAction: update failed", error, { userId });
    return;
  }

  await notifyPremiumFixed(profile.email, profile.full_name);

  revalidatePath(`/admin/users/${userId}`);
}

// Recours pour les comptes déjà passés Premium (statut correct) mais dont le
// LTV est resté à 0 -- invoice.paid s'avère systémiquement en échec en prod
// (3+ paiements réels confirmés, un seul reflété avant correction manuelle) :
// /premium/success crédite maintenant le paiement à la volée pour toute
// NOUVELLE conversion, mais les comptes déjà touchés avant ce correctif
// restent à corriger une fois à la main. 799 = 7,99€ (mensuel) ; 7000 = 70€
// (accès à vie, voir premium/actions.ts) -- deux prix possibles depuis le
// 26/09, donc le bon montant est désormais choisi côté appelant (voir
// admin/premium/page.tsx) selon subscription_status plutôt que deviné ici.
const MONTHLY_PRICE_CENTS = 799;

export async function fixMissingLtvAction(formData: FormData) {
  await assertAdminSession();
  const userId = formData.get("userId") as string;
  if (!userId) return;
  const amountCents = Number(formData.get("amountCents")) || MONTHLY_PRICE_CENTS;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ total_paid_cents: amountCents })
    .eq("id", userId)
    .eq("total_paid_cents", 0);

  if (error) {
    console.error("fixMissingLtvAction: update failed", error, { userId });
  }

  revalidatePath("/admin/premium");
  revalidatePath(`/admin/users/${userId}`);
}

// Correctif définitif du trou historique de LTV, au-delà du correctif au cas
// par cas ci-dessus (fixMissingLtvAction, qui se contente de poser un prix
// forfaitaire sur les comptes à 0€ -- imprécis pour un client qui a payé
// plusieurs mois dont certains manquants). La vraie cause (voir migration
// 20260913000000) est corrigée pour tout NOUVEAU paiement, mais les factures
// déjà marquées "traitées" dans le registre avant ce correctif restent
// bloquées pour toujours -- rien ne les rejoue automatiquement. Ici, on va
// chercher l'historique RÉEL des factures payées côté Stripe pour chaque
// client connu, et on crédite via la même fonction idempotente que le
// webhook : sans risque à relancer plusieurs fois, une facture déjà créditée
// correctement ne l'est jamais deux fois.
export async function reconcileAllInvoicesAction() {
  await assertAdminSession();
  const admin = createAdminClient();
  const stripe = getStripeClient();

  // Bornée par prudence (voir commentaire plus bas sur "profiles" et le Max
  // Rows Supabase) même si le nombre de clients Stripe connus reste faible
  // aujourd'hui -- ne jamais dépendre d'un select sans limite sur une table
  // qui grossit indéfiniment.
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .not("stripe_customer_id", "is", null)
    .order("id")
    .limit(5000);

  if (profilesError) {
    console.error("reconcileAllInvoicesAction: query failed", profilesError);
    redirect("/admin/premium?reconcile_error=1");
  }

  let invoicesChecked = 0;
  let recoveredCents = 0;
  let customersFailed = 0;

  // Le montant "récupéré" est suivi facture par facture (jamais via une
  // somme totale de profiles avant/après) : "profiles" a déjà dépassé le
  // "Max Rows" par défaut de l'API Supabase une fois (voir migration
  // 20260914000000), et une somme calculée sur des lignes tronquées avait
  // produit un montant "récupéré" négatif, impossible autrement puisqu'on
  // n'additionne jamais que des montants positifs.
  for (const profile of profiles ?? []) {
    const customerId = profile.stripe_customer_id;
    if (!customerId) continue;
    try {
      const invoices = await stripe.invoices.list({ customer: customerId, status: "paid", limit: 100 });
      for (const invoice of invoices.data) {
        if (invoice.amount_paid <= 0) continue;
        invoicesChecked += 1;

        const { data: existing } = await admin
          .from("stripe_processed_invoices")
          .select("invoice_id")
          .eq("invoice_id", invoice.id)
          .maybeSingle();

        const { error: creditError } = await creditInvoicePayment(
          invoice.id,
          customerId,
          invoice.amount_paid,
        );
        if (creditError) {
          console.error("reconcileAllInvoicesAction: creditInvoicePayment failed", creditError, {
            customerId,
            invoiceId: invoice.id,
          });
        } else if (!existing) {
          recoveredCents += invoice.amount_paid;
        }
      }
    } catch (stripeError) {
      customersFailed += 1;
      console.error("reconcileAllInvoicesAction: Stripe fetch failed", stripeError, { customerId });
    }
  }

  console.log(
    `reconcileAllInvoicesAction: ${invoicesChecked} facture(s) vérifiée(s), ${recoveredCents} centime(s) récupéré(s), ${customersFailed} client(s) en échec`,
  );

  revalidatePath("/admin/premium");
  redirect(
    `/admin/premium?reconcile_checked=${invoicesChecked}&reconcile_recovered=${recoveredCents}&reconcile_failed=${customersFailed}`,
  );
}

// Recours pour l'autre moitié du même bug que reconcileAllInvoicesAction :
// customer.subscription.updated/deleted est un event Stripe À PART de
// checkout.session.completed, livré sans garantie d'ordre -- s'il arrive
// en premier, stripe_customer_id n'est pas encore posé sur le profil et
// l'update de subscription_status ne matche rien. Corrigé pour tout
// NOUVEL event (voir le retry 409 dans le webhook), mais deux clients
// confirmés en logs (12 et 13/09) sont restés bloqués sur un statut
// périmé -- Stripe a déjà marqué ces deliveries "réussies", donc plus
// aucun retry automatique ne viendra les rattraper. Repart du dernier
// abonnement connu de chaque client Stripe et rejoue la même synchro
// idempotente que le webhook.
export async function reconcileAllSubscriptionsAction() {
  await assertAdminSession();
  const admin = createAdminClient();
  const stripe = getStripeClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .not("stripe_customer_id", "is", null)
    .order("id")
    .limit(5000);

  if (profilesError) {
    console.error("reconcileAllSubscriptionsAction: query failed", profilesError);
    redirect("/admin/premium?subreconcile_error=1");
  }

  let checked = 0;
  let resynced = 0;
  let customersFailed = 0;

  for (const profile of profiles ?? []) {
    const customerId = profile.stripe_customer_id;
    if (!customerId) continue;
    try {
      // Le plus récent créé = l'abonnement qui doit faire foi aujourd'hui
      // (list() trie par created desc côté Stripe) -- un client n'a en
      // pratique qu'un seul abonnement Premium à la fois sur ce produit.
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
      const subscription = subscriptions.data[0];
      if (!subscription) continue;
      checked += 1;

      const { matched, error } = await syncSubscriptionToProfile(subscription);
      if (error) {
        console.error("reconcileAllSubscriptionsAction: sync failed", error, { customerId });
      } else if (matched) {
        resynced += 1;
      }
    } catch (stripeError) {
      customersFailed += 1;
      console.error("reconcileAllSubscriptionsAction: Stripe fetch failed", stripeError, { customerId });
    }
  }

  console.log(
    `reconcileAllSubscriptionsAction: ${checked} client(s) vérifié(s), ${resynced} resynchronisé(s), ${customersFailed} en échec`,
  );

  revalidatePath("/admin/premium");
  redirect(
    `/admin/premium?subreconcile_checked=${checked}&subreconcile_resynced=${resynced}&subreconcile_failed=${customersFailed}`,
  );
}

// Déclenchement manuel pour un cas repéré à la main dans le dashboard
// Stripe (paiement "Incomplet") : le webhook envoie déjà ce mail
// automatiquement dès qu'un abonnement passe en 'incomplete' (voir
// src/app/api/stripe/webhook/route.ts), mais ce bouton permet de relancer
// tout de suite sans attendre/dépendre d'un nouvel event Stripe -- utile
// pour les cas déjà en base avant que cet automatisme n'existe. Recherche
// par email : c'est l'info directement disponible depuis le dashboard
// Stripe, pas d'obligation de retrouver l'utilisateur dans /admin/users.
export async function sendIncompletePaymentReminderAction(formData: FormData) {
  await assertAdminSession();
  const email = (formData.get("email") as string)?.trim();
  if (!email) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    console.error("sendIncompletePaymentReminderAction: aucun profil pour cet email", { email });
    return;
  }

  const { error } = await notifyIncompletePaymentOnce(profile.id);
  if (error) {
    console.error("sendIncompletePaymentReminderAction failed", error, { email });
  }

  revalidatePath("/admin/premium");
}

// sendWeeklyOfferAnnouncementAction (campagne ponctuelle annonçant le
// lancement de l'offre hebdomadaire à 3,50€/semaine) supprimée le 26/09 :
// cette formule est retirée (voir hard paywall, RETENTION_AUDIT.md), l'email
// qu'elle envoyait ("Nouveau sur Stageio : Premium à 3,50€ la semaine")
// pointait vers une offre qui n'existe plus sur /premium -- la garder
// aurait été un vrai bug (email actif faisant la publicité d'un plan qui ne
// peut plus être acheté), pas juste du code mort inoffensif.
