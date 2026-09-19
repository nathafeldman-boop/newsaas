"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/resend/client";

function generateAffiliateCode(): string {
  return randomBytes(5).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

// Notifie l'admin d'une nouvelle candidature affilié : contrairement au
// parrainage (auto-accordé), ici de l'argent réel sera dû -- l'admin doit
// savoir dès qu'une candidature arrive pour la valider (ou pas) sans
// attendre de tomber dessus par hasard sur /admin/affiliates.
async function notifyAdminNewApplication(email: string, fullName: string | null) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) return;

  try {
    const resend = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    await resend.emails.send({
      from: `Stageio <${fromEmail}>`,
      to: adminEmails,
      subject: "Nouvelle candidature affilié Stageio",
      html: `<p>${fullName || email} (${email}) vient de candidater au programme d'affiliation.</p>
<p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://stageio.fr"}/admin/affiliates">Voir la candidature</a></p>`,
    });
  } catch (err) {
    // Best-effort : une candidature reste visible sur /admin/affiliates même
    // si cet email échoue -- jamais bloquant.
    console.error("notifyAdminNewApplication failed", err, { email });
  }
}

export async function applyAsAffiliateAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affilies");

  const payoutEmail = ((formData.get("payoutEmail") as string) || "").trim();
  if (!payoutEmail.includes("@")) {
    redirect("/affilies?error=invalid_email");
  }

  const { data: existing } = await supabase
    .from("affiliates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect("/affilies");
  }

  const code = generateAffiliateCode();
  const { error } = await supabase
    .from("affiliates")
    .insert({ user_id: user.id, code, payout_email: payoutEmail });

  if (error) {
    console.error("applyAsAffiliateAction: insert failed", error, { userId: user.id });
    redirect("/affilies?error=1");
  }

  await notifyAdminNewApplication(user.email ?? payoutEmail, user.user_metadata?.full_name ?? null);

  revalidatePath("/affilies");
  redirect("/affilies");
}
