"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPremiumFixed } from "@/lib/resend/notifyPremiumFixed";

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
