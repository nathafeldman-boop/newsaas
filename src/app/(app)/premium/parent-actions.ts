"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { goLink } from "@/lib/premium/goLink";
import { CONSENT_RESEND_MS, sendParentPaymentEmail } from "@/lib/schoolStage/parentConsent";

// Élève de moins de 15 ans au paywall (18/11) : le lien de paiement signé
// (même lien que les e-mails, sans connexion) part à l'e-mail de son parent.
export async function askParentToPayAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("full_name, school_stage, parent_email, parent_consent_sent_at").eq("id", user.id).maybeSingle();
  if (!p?.school_stage || !p.parent_email) redirect("/premium");
  if (p.parent_consent_sent_at && Date.now() - Date.parse(p.parent_consent_sent_at) < CONSENT_RESEND_MS) redirect("/premium?parent=attends");
  const sent = await sendParentPaymentEmail({
    userId: user.id,
    parentEmail: p.parent_email,
    firstName: p.full_name?.split(" ")[0] ?? null,
    level: p.school_stage,
    payUrl: goLink(user.id, "choix", "utm_source=email&utm_medium=email&utm_campaign=parent-paiement"),
  });
  if (sent) await admin.from("profiles").update({ parent_consent_sent_at: new Date().toISOString() }).eq("id", user.id);
  redirect(`/premium?parent=${sent ? "envoye" : "erreur"}`);
}
