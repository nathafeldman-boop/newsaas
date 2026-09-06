"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPremiumFixed } from "@/lib/resend/notifyPremiumFixed";
import { notifyIncompletePaymentOnce } from "@/lib/stripe/notifyIncompletePayment";
import { notifyWeeklyOffer } from "@/lib/resend/notifyWeeklyOffer";
import { isPremium } from "@/lib/subscription/isPremium";
import { FREE_WEEKLY_SWIPE_QUOTA } from "@/lib/subscription/quota";

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
// restent à corriger une fois à la main. 799 = 7,99€, le seul prix pratiqué.
const CURRENT_PRICE_CENTS = 799;

export async function fixMissingLtvAction(formData: FormData) {
  await assertAdminSession();
  const userId = formData.get("userId") as string;
  if (!userId) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ total_paid_cents: CURRENT_PRICE_CENTS })
    .eq("id", userId)
    .eq("total_paid_cents", 0);

  if (error) {
    console.error("fixMissingLtvAction: update failed", error, { userId });
  }

  revalidatePath("/admin/premium");
  revalidatePath(`/admin/users/${userId}`);
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

// Relance en masse au lancement de l'offre hebdomadaire (3,50€/semaine,
// voir /premium) : prévient tous les inscrits déjà passés par le mur
// payant sans avoir pris Premium. "Passé par le mur" n'a pas de tracking
// dédié (site_visits n'est pas fiable pour ça, voir ailleurs) -- on
// retombe sur le signal le plus proche disponible en base : au moins
// FREE_WEEKLY_SWIPE_QUOTA swipes de découverte au compteur, ce qui suffit
// en pratique à avoir buté sur le quota gratuit au moins une fois.
// Idempotent via weekly_offer_announced_at : renvoyer l'action (ex: après
// un timeout sur un gros volume) ne réenvoie jamais deux fois le même
// compte, elle reprend juste là où elle s'est arrêtée.
export async function sendWeeklyOfferAnnouncementAction() {
  await assertAdminSession();
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, subscription_status")
    .eq("onboarding_completed", true)
    .is("weekly_offer_announced_at", null)
    .not("email", "is", null);

  if (error) {
    console.error("sendWeeklyOfferAnnouncementAction: query failed", error);
    return;
  }

  const candidates = (profiles ?? []).filter((p) => !isPremium(p));

  let sent = 0;
  for (const profile of candidates) {
    if (!profile.email) continue;

    const { count } = await admin
      .from("swipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id);

    if ((count ?? 0) < FREE_WEEKLY_SWIPE_QUOTA) continue;

    try {
      await notifyWeeklyOffer(profile.email, profile.full_name);
      await admin
        .from("profiles")
        .update({ weekly_offer_announced_at: new Date().toISOString() })
        .eq("id", profile.id);
      sent += 1;
    } catch (sendError) {
      console.error("sendWeeklyOfferAnnouncementAction: failed for", profile.id, sendError);
    }
  }

  console.log(`sendWeeklyOfferAnnouncementAction: envoyé à ${sent}/${candidates.length} candidat(s)`);
  revalidatePath("/admin/premium");
}
