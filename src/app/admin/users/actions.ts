"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPremiumFixed } from "@/lib/resend/notifyPremiumFixed";
import { notifyCheckoutAbandoned } from "@/lib/resend/notifyCheckoutAbandoned";
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
// restent à corriger une fois à la main. 799 = 7,99€ (mensuel) ; 3999 =
// 39,99€ (accès à vie, voir premium/actions.ts -- 70€ avant le 27/09) --
// plusieurs prix possibles selon la formule et la date d'achat, donc le bon
// montant est désormais choisi côté appelant (voir admin/premium/page.tsx)
// selon subscription_status plutôt que deviné ici.
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

// Recours pour l'autre moitié du bug corrigé dans le webhook le 04/10
// (checkout.session.completed dont l'UPDATE profiles ne matchait aucune
// ligne, sans jamais lever d'erreur) : reconcileAllSubscriptionsAction et
// reconcileAllInvoicesAction ci-dessus ne couvrent QUE les profils qui ont
// déjà un stripe_customer_id posé -- inutile ici puisque c'est précisément
// ce champ qui n'a jamais été écrit. Part du customerId Stripe brut (visible
// dans le dashboard Stripe, voir la conversation avec Nathan du 04/10),
// retrouve le profil par email, pose le lien manquant, puis rejoue la même
// synchro idempotente que le webhook (abonnement récurrent ET factures
// payées -- un achat à vie n'a pas d'abonnement Stripe, seulement une
// facture, voir premium/actions.ts).
export async function linkOrphanedStripeCustomerAction(formData: FormData) {
  await assertAdminSession();
  const customerId = (formData.get("customerId") as string)?.trim();
  if (!customerId) redirect("/admin/premium?orphan_error=missing_id");

  const admin = createAdminClient();
  const stripe = getStripeClient();

  let email: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    email = customer.deleted ? null : customer.email;
  } catch (err) {
    console.error("linkOrphanedStripeCustomerAction: Stripe customer fetch failed", err, { customerId });
    redirect(`/admin/premium?orphan_error=stripe_not_found&orphan_customer=${customerId}`);
  }
  if (!email) redirect(`/admin/premium?orphan_error=no_email&orphan_customer=${customerId}`);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) {
    redirect(
      `/admin/premium?orphan_error=no_profile&orphan_customer=${customerId}&orphan_email=${encodeURIComponent(email)}`,
    );
  }
  if (profile.stripe_customer_id && profile.stripe_customer_id !== customerId) {
    // Jamais écraser un lien existant à l'aveugle : un profil déjà lié à un
    // AUTRE customerId mérite une vérification manuelle, pas une correction
    // automatique qui pourrait se tromper de client.
    console.error("linkOrphanedStripeCustomerAction: profil déjà lié à un autre client Stripe", {
      profileId: profile.id,
      existing: profile.stripe_customer_id,
      customerId,
    });
    redirect(`/admin/premium?orphan_error=conflict&orphan_customer=${customerId}`);
  }

  const { error: linkError } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", profile.id);
  if (linkError) {
    console.error("linkOrphanedStripeCustomerAction: lien échoué", linkError, { customerId, profileId: profile.id });
    redirect(`/admin/premium?orphan_error=link_failed&orphan_customer=${customerId}`);
  }

  let resynced = false;
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
  const subscription = subscriptions.data[0];
  if (subscription) {
    const { matched } = await syncSubscriptionToProfile(subscription);
    resynced = matched;
  }

  const invoices = await stripe.invoices.list({ customer: customerId, status: "paid", limit: 10 });
  let invoicesCredited = 0;
  for (const invoice of invoices.data) {
    if (invoice.amount_paid <= 0 || !invoice.id) continue;
    const { credited, error } = await creditInvoicePayment(invoice.id, customerId, invoice.amount_paid);
    if (error) {
      console.error("linkOrphanedStripeCustomerAction: creditInvoicePayment échoué", error, {
        customerId,
        invoiceId: invoice.id,
      });
    } else if (credited) {
      invoicesCredited += 1;
    }
  }

  // Aucun abonnement récurrent mais au moins une facture payée = achat à vie
  // (voir invoice_creation dans premium/actions.ts) -- n'écrase jamais un
  // statut déjà posé par ailleurs (comp, etc.).
  if (!subscription && invoices.data.length > 0) {
    const { error: lifetimeError } = await admin
      .from("profiles")
      .update({ subscription_status: "lifetime", premium_activated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .is("subscription_status", null);
    if (lifetimeError) {
      console.error("linkOrphanedStripeCustomerAction: statut lifetime échoué", lifetimeError, { customerId });
    }
  }

  revalidatePath("/admin/premium");
  redirect(
    `/admin/premium?orphan_linked=1&orphan_customer=${customerId}&orphan_resynced=${resynced ? 1 : 0}&orphan_invoices=${invoicesCredited}`,
  );
}

// Relance "panier abandonné" demandée par Nathan (04/10, après avoir vu la
// liste des clients Stripe sans paiement) : tous les comptes qui ont cliqué
// sur un plan Premium (stripe_customer_id posé par getOrCreateStripeCustomer,
// voir premium/actions.ts) mais ne sont jamais devenus Premium. Construit la
// liste depuis la base plutôt que depuis les emails du dashboard Stripe :
// ne rate personne, et ne recontacte jamais quelqu'un déjà devenu Premium
// entre-temps par un autre chemin (code admin "comp", paiement réussi après
// coup...). checkout_abandoned_reminder_sent_at rend l'action rejouable sans
// jamais spammer deux fois le même compte.
export async function sendCheckoutAbandonedReminderAction() {
  await assertAdminSession();
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .not("stripe_customer_id", "is", null)
    .not("subscription_status", "in", "(active,trialing,comp,lifetime)")
    .is("checkout_abandoned_reminder_sent_at", null)
    .eq("notify_new_offers", true)
    .not("email", "is", null)
    .order("id")
    .limit(2000);

  if (profilesError) {
    console.error("sendCheckoutAbandonedReminderAction: query failed", profilesError);
    redirect("/admin/premium?abandoned_error=1");
  }

  let sent = 0;
  let failed = 0;

  for (const profile of profiles ?? []) {
    if (!profile.email) continue;
    try {
      await notifyCheckoutAbandoned(profile.email, profile.full_name, profile.id);
      const { error } = await admin
        .from("profiles")
        .update({ checkout_abandoned_reminder_sent_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (error) {
        console.error("sendCheckoutAbandonedReminderAction: flag update failed", error, {
          profileId: profile.id,
        });
      }
      sent += 1;
    } catch (emailError) {
      failed += 1;
      console.error("sendCheckoutAbandonedReminderAction: envoi échoué", emailError, { profileId: profile.id });
    }
  }

  revalidatePath("/admin/premium");
  redirect(`/admin/premium?abandoned_sent=${sent}&abandoned_failed=${failed}`);
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
