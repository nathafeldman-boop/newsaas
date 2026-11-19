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

// Stages scolaires (18/11) : classe et date de naissance, choisies à l'étape
// « Tu cherches quoi ? ». Colonnes verrouillées pour l'appli (trigger
// protect_paid_profile_columns) : écrites ici avec la clé service, pour le
// compte de la session seulement. Rien n'est envoyé aux parents (Nathan,
// 18/11 : sous 15 ans, une case à cocher au paywall suffit).
export async function saveSchoolStageOnboardingAction(input: { level: string; birthDate: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isSchoolStageLevel, ageOn } = await import("@/lib/schoolStage/levels");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi." };
  if (!isSchoolStageLevel(input.level)) return { ok: false, error: "Choisis ta classe." };
  const age = ageOn(input.birthDate);
  if (age === null || age < 10 || age > 25) return { ok: false, error: "Indique ta vraie date de naissance." };
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ school_stage: input.level as never, birth_date: input.birthDate })
    .eq("id", user.id);
  if (error) {
    console.error("onboarding scolaire : profil non enregistré", error.message);
    return { ok: false, error: "L'enregistrement n'a pas marché, réessaie." };
  }
  return { ok: true };
}

// Preuve P3 du test A/B d'onboarding (19/11) : offres publiées ces 7
// derniers jours pour le métier et la ville choisis. Vrai compte en base,
// borné (métier et ville nettoyés, pas de joker), null si la base échoue.
export async function countWeekOffersAction(input: { job: string | null; city: string; lookingFor: string[] }): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const clean = (s: string) => s.replace(/[%_,()*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  const word = clean((input.job ?? "").split(/[\s/(]/)[0] ?? "");
  const city = clean(input.city.split(" (")[0] ?? "");
  const contracts = input.lookingFor.filter((c) => ["cdi", "cdd", "alternance", "stage", "stage_scolaire"].includes(c));
  let q = createAdminClient()
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("published_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
  if (contracts.length > 0) q = q.in("contract_type", contracts as never[]);
  if (word.length >= 3) q = q.ilike("title", `%${word}%`);
  if (city.length >= 2) q = q.ilike("location", `%${city}%`);
  const { count, error } = await q;
  if (error) {
    console.error("onboarding : offres de la semaine non comptées", error.message);
    return null;
  }
  return count ?? 0;
}
