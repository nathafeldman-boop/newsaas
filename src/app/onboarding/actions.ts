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

// Stages scolaires (18/11) : classe, date de naissance et e-mail d'un parent
// (moins de 15 ans), choisis à l'étape « Tu cherches quoi ? ». Colonnes
// verrouillées pour l'appli (trigger protect_paid_profile_columns) : écrites
// ici avec la clé service, pour le compte de la session seulement. Sous
// 15 ans, le parent reçoit le lien d'accord ; c'est lui qui paiera.
export async function saveSchoolStageOnboardingAction(input: { level: string; birthDate: string; parentEmail: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isSchoolStageLevel, ageOn, CONSENT_AGE } = await import("@/lib/schoolStage/levels");
  const { EMAIL_RE, sendParentConsentEmail, CONSENT_RESEND_MS } = await import("@/lib/schoolStage/parentConsent");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi." };
  if (!isSchoolStageLevel(input.level)) return { ok: false, error: "Choisis ta classe." };
  const age = ageOn(input.birthDate);
  if (age === null || age < 10 || age > 25) return { ok: false, error: "Indique ta vraie date de naissance." };
  const parentEmail = input.parentEmail.trim().toLowerCase().slice(0, 160);
  const needsParent = age < CONSENT_AGE;
  if (needsParent && !EMAIL_RE.test(parentEmail)) return { ok: false, error: "Tu as moins de 15 ans : indique l'e-mail d'un de tes parents." };
  if (needsParent && parentEmail === (user.email ?? "").toLowerCase()) return { ok: false, error: "L'e-mail du parent doit être différent du tien." };

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("profiles")
    .select("full_name, school_stage, birth_date, parent_email, parent_consent_at, parent_consent_sent_at")
    .eq("id", user.id)
    .maybeSingle();
  if (current?.school_stage && current.birth_date && current.birth_date !== input.birthDate) {
    return { ok: false, error: "Ta date de naissance ne peut plus être changée. Écris-nous si elle est fausse." };
  }
  const { error } = await admin
    .from("profiles")
    .update({
      school_stage: input.level as never,
      birth_date: input.birthDate,
      parent_email: needsParent ? parentEmail : null,
      ...(needsParent && current?.parent_email !== parentEmail ? { parent_consent_at: null } : {}),
    })
    .eq("id", user.id);
  if (error) {
    console.error("onboarding scolaire : profil non enregistré", error.message);
    return { ok: false, error: "L'enregistrement n'a pas marché, réessaie." };
  }
  const recentlySent = !!current?.parent_consent_sent_at && Date.now() - Date.parse(current.parent_consent_sent_at) < CONSENT_RESEND_MS;
  if (needsParent && !(current?.parent_email === parentEmail && (current?.parent_consent_at || recentlySent))) {
    const sent = await sendParentConsentEmail({ userId: user.id, parentEmail, firstName: current?.full_name?.split(" ")[0] ?? null, level: input.level });
    if (sent) await admin.from("profiles").update({ parent_consent_sent_at: new Date().toISOString() }).eq("id", user.id);
  }
  return { ok: true };
}
