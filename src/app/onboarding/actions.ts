"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// "granted" = le filleul a bien terminé l'onboarding (un simple signup non
// suivi d'onboarding ne valide pas le parrainage). La table referrals n'a
// aucune policy insert/update pour les utilisateurs (voir 20260901000001_rls.sql),
// donc ce changement de statut ne peut passer que par le client admin.
export async function markReferralGrantedAction(userId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.referred_by) return;

  await admin.from("referrals").update({ reward_status: "granted" }).eq("referred_id", userId);
}
