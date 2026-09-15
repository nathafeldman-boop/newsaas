import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Envoie un email au parrain quand son lien génère une inscription.
// Idempotent : le update ... is('notified_at', null) garantit un envoi unique
// même si la fonction est appelée plusieurs fois pour le même filleul
// (ex: lien de confirmation cliqué deux fois).
export async function notifyReferrerOfNewSignup(referredUserId: string) {
  const admin = createAdminClient();

  const { data: referral, error: updateError } = await admin
    .from("referrals")
    .update({ notified_at: new Date().toISOString() })
    .eq("referred_id", referredUserId)
    .is("notified_at", null)
    .select("referrer_id")
    .maybeSingle();

  // `!referral` peut vouloir dire "déjà notifié" (normal, cas idempotent) OU
  // "la requête a échoué" (ex: colonne/table pas migrée) -- sans ce log les
  // deux étaient indiscernables, et un échec réel faisait silencieusement
  // manquer l'email au parrain sans aucune trace.
  if (updateError) {
    console.error("notifyReferrerOfNewSignup: referrals update failed", updateError, { referredUserId });
  }
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

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: referrer.email,
    subject: "Un pote vient de s'inscrire grâce à toi 🎉",
    html: `<p>Salut${referrer.full_name ? ` ${referrer.full_name}` : ""},</p>
<p><strong>${referred?.full_name || "Quelqu'un"}</strong> vient de créer son compte sur Stageio avec ton lien de parrainage.</p>
<p>Retrouve le suivi de tes filleuls sur ton <a href="${SITE_URL}/parrainage">tableau de parrainage</a>.</p>`,
  });
}
