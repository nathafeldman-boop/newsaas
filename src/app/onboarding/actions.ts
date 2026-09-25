"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "granted" = le filleul a bien terminé l'onboarding (un simple signup non
// suivi d'onboarding ne valide pas le parrainage). La table referrals n'a
// aucune policy insert/update pour les utilisateurs (voir 20260901000001_rls.sql),
// donc ce changement de statut ne peut passer que par le client admin.
//
// Une Server Action Next.js reste un endpoint appelable directement,
// indépendamment de l'UI qui l'invoque normalement -- le paramètre `userId`
// ne peut donc JAMAIS être fait confiance tel quel : sans la vérification de
// session ci-dessous, n'importe quel compte connecté pouvait appeler cette
// action avec l'id d'un autre utilisateur et faire passer sa propre
// récompense de parrainage à "granted" sans avoir terminé l'onboarding, ni
// même être son propre filleul. L'id du paramètre est ignoré : seul celui de
// la session authentifiée est utilisé.
export async function markReferralGrantedAction(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.referred_by) return;

  const { error } = await admin.from("referrals").update({ reward_status: "granted" }).eq("referred_id", user.id);
  if (error) {
    console.error("markReferralGrantedAction: referrals update failed", error, { userId: user.id });
  }
}
