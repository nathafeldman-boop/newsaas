"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONSENT_AGE, ageOn, isSchoolStageLevel } from "@/lib/schoolStage/levels";
import { CONSENT_RESEND_MS, EMAIL_RE, sendParentConsentEmail } from "@/lib/schoolStage/parentConsent";
import { schoolSector } from "@/lib/schoolStage/companies";

// Formulaire de /stages-scolaires (18/11). Écrit par le serveur (clé
// service) : ces colonnes sont verrouillées pour l'appli (trigger
// protect_paid_profile_columns), pour qu'un élève ne puisse pas se donner
// l'accord parental lui-même.

const back = (q: string) => redirect(`/stages-scolaires?${q}`);

export async function saveSchoolStageAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/stages-scolaires");

  const level = String(formData.get("level") ?? "");
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const city = String(formData.get("city") ?? "").trim().slice(0, 80);
  const sectorId = String(formData.get("sector") ?? "");
  const parentEmail = String(formData.get("parent_email") ?? "").trim().toLowerCase().slice(0, 160);

  if (!isSchoolStageLevel(level)) back("erreur=niveau");
  const now = new Date();
  const age = ageOn(birthDate, now);
  if (age === null || age < 10 || age > 25) back("erreur=naissance");
  if (!fullName || !city) back("erreur=champs");
  const needsParent = age! < CONSENT_AGE;
  if (needsParent && !EMAIL_RE.test(parentEmail)) back("erreur=parent");

  const admin = createAdminClient();
  const { data: current } = await admin.from("profiles").select("school_stage, birth_date, looking_for, email, parent_email, parent_consent_at, parent_consent_sent_at").eq("id", user.id).maybeSingle();
  // Date de naissance fixée au premier enregistrement : on ne se vieillit pas après coup.
  if (current?.school_stage && current.birth_date && current.birth_date !== birthDate) back("erreur=naissance_fixe");
  if (needsParent && parentEmail === (current?.email ?? user.email ?? "").toLowerCase()) back("erreur=parent_meme");

  const { error } = await admin
    .from("profiles")
    .update({
      school_stage: level as never,
      birth_date: birthDate,
      full_name: fullName,
      city,
      parent_email: needsParent ? parentEmail : null,
      // Nouveau parent : son accord à lui est demandé.
      ...(needsParent && current?.parent_email !== parentEmail ? { parent_consent_at: null } : {}),
      looking_for: current?.looking_for?.length ? current.looking_for : ["stage"],
      onboarding_completed: true,
      onboarding_completed_at: now.toISOString(),
    })
    .eq("id", user.id);
  if (error) {
    console.error("stages scolaires : profil non enregistré", error.message);
    back("erreur=base");
  }

  // Pas de nouvel e-mail au parent si rien n'a changé (ou s'il a déjà dit oui).
  const sameParent = current?.parent_email === parentEmail;
  const recentlySent = !!current?.parent_consent_sent_at && Date.now() - Date.parse(current.parent_consent_sent_at) < CONSENT_RESEND_MS;
  if (needsParent && !(sameParent && (current?.parent_consent_at || recentlySent))) {
    const firstName = fullName.split(" ")[0] ?? null;
    if (await sendParentConsentEmail({ userId: user.id, parentEmail, firstName, level: level as never })) {
      await admin.from("profiles").update({ parent_consent_sent_at: now.toISOString() }).eq("id", user.id);
    }
  }
  revalidatePath("/stages-scolaires");
  back(schoolSector(sectorId) ? `secteur=${sectorId}` : "ok=1");
}

export async function resendParentConsentAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/stages-scolaires");
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("full_name, school_stage, parent_email, parent_consent_at, parent_consent_sent_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!p?.school_stage || !p.parent_email || p.parent_consent_at) back("");
  if (p!.parent_consent_sent_at && Date.now() - Date.parse(p!.parent_consent_sent_at) < CONSENT_RESEND_MS) back("renvoi=attends");
  const sent = await sendParentConsentEmail({
    userId: user.id,
    parentEmail: p!.parent_email!,
    firstName: p!.full_name?.split(" ")[0] ?? null,
    level: p!.school_stage!,
  });
  if (sent) await admin.from("profiles").update({ parent_consent_sent_at: new Date().toISOString() }).eq("id", user.id);
  back(sent ? "renvoi=ok" : "renvoi=erreur");
}
