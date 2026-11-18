"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyConsentParams } from "@/lib/schoolStage/parentConsent";

// Clic du parent sur « Je donne mon accord » (lien signé reçu par e-mail).
export async function giveParentConsentAction(formData: FormData) {
  const params = { u: String(formData.get("u") ?? ""), e: String(formData.get("e") ?? ""), s: String(formData.get("s") ?? "") };
  const qs = new URLSearchParams(params).toString();
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("parent_email, parent_consent_at").eq("id", params.u).maybeSingle();
  if (!p || !verifyConsentParams(params, p.parent_email)) redirect(`/accord-parental?${qs}`);
  if (!p.parent_consent_at) {
    const { error } = await admin.from("profiles").update({ parent_consent_at: new Date().toISOString() }).eq("id", params.u);
    if (error) {
      console.error("accord parental non enregistré", error.message);
      redirect(`/accord-parental?${qs}&erreur=1`);
    }
  }
  redirect(`/accord-parental?${qs}&merci=1`);
}
