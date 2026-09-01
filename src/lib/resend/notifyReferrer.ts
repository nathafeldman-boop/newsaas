import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";

// Envoie un email au parrain quand son lien génère une inscription.
// Idempotent : le update ... is('notified_at', null) garantit un envoi unique
// même si la fonction est appelée plusieurs fois pour le même filleul
// (ex: lien de confirmation cliqué deux fois).
export async function notifyReferrerOfNewSignup(referredUserId: string) {
  const admin = createAdminClient();

  const { data: referral } = await admin
    .from("referrals")
    .update({ notified_at: new Date().toISOString() })
    .eq("referred_id", referredUserId)
    .is("notified_at", null)
    .select("referrer_id")
    .maybeSingle();

  if (!referral) return;

  const [{ data: referrer }, { data: referred }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", referral.referrer_id)
      .single(),
    admin.from("profiles").select("full_name").eq("id", referredUserId).single(),
  ]);

  if (!referrer?.email) return;

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alt.app";

  await resend.emails.send({
    from: `Alt <${fromEmail}>`,
    to: referrer.email,
    subject: "Un pote vient de s'inscrire grâce à toi 🎉",
    html: `<p>Salut${referrer.full_name ? ` ${referrer.full_name}` : ""},</p>
<p><strong>${referred?.full_name || "Quelqu'un"}</strong> vient de créer son compte sur Alt avec ton lien de parrainage.</p>
<p>Retrouve le suivi de tes filleuls sur ton <a href="${siteUrl}/parrainage">tableau de parrainage</a>.</p>`,
  });
}
