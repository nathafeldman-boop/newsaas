import { createAdminClient } from "@/lib/supabase/admin";

// Rattache un filleul à son parrain pour les connexions OAuth (Google), où le
// code de parrainage ne peut pas passer par raw_user_meta_data comme pour un
// signUp() classique — on le fait transiter par le paramètre `ref` de l'URL
// de retour d'OAuth à la place.
export async function attachReferralIfNeeded(userId: string, refCode: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .single();

  if (!profile || profile.referred_by) return;

  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", refCode.toUpperCase())
    .maybeSingle();

  if (!referrer || referrer.id === userId) return;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", userId);
  if (profileError) {
    console.error("attachReferralIfNeeded: profiles update failed", profileError, { userId, referrerId: referrer.id });
  }

  const { error: referralError } = await admin.from("referrals").upsert(
    { referrer_id: referrer.id, referred_id: userId, code: refCode.toUpperCase() },
    { onConflict: "referred_id" },
  );
  if (referralError) {
    console.error("attachReferralIfNeeded: referrals upsert failed", referralError, { userId, referrerId: referrer.id });
  }
}
