import { createAdminClient } from "@/lib/supabase/admin";

// Miroir de attachReferral.ts pour le programme d'affiliation : le code
// affilié ne peut pas passer par raw_user_meta_data pour une connexion
// OAuth (Google), donc il transite par le paramètre `aff` de l'URL de
// retour d'OAuth à la place -- voir GoogleButton.tsx et auth/callback/route.ts.
export async function attachAffiliateIfNeeded(userId: string, affCode: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("affiliate_id")
    .eq("id", userId)
    .single();

  if (!profile || profile.affiliate_id) return;

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id")
    .eq("code", affCode.toUpperCase())
    .eq("status", "approved")
    .maybeSingle();

  if (!affiliate) return;

  const { error } = await admin
    .from("profiles")
    .update({ affiliate_id: affiliate.id })
    .eq("id", userId);
  if (error) {
    console.error("attachAffiliateIfNeeded: profiles update failed", error, { userId, affiliateId: affiliate.id });
  }
}
