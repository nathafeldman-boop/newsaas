"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAffiliateApproved } from "@/lib/resend/notifyAffiliateApproved";

export async function approveAffiliateAction(formData: FormData) {
  await assertAdminSession();
  const id = formData.get("id") as string;
  if (!id) return;

  const admin = createAdminClient();
  const { data: affiliate, error } = await admin
    .from("affiliates")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id)
    .select("code, user_id")
    .maybeSingle();

  if (error) {
    console.error("approveAffiliateAction: update failed", error, { id });
    return;
  }
  if (!affiliate) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", affiliate.user_id)
    .maybeSingle();

  if (profile?.email) {
    try {
      await notifyAffiliateApproved(profile.email, profile.full_name, affiliate.code);
    } catch (err) {
      // Best-effort : l'approbation reste actée même si l'email échoue --
      // l'affilié verra son statut passer à "approuvé" en revisitant /affilies.
      console.error("approveAffiliateAction: notification email failed", err, { id });
    }
  }

  revalidatePath("/admin/affiliates");
}

export async function rejectAffiliateAction(formData: FormData) {
  await assertAdminSession();
  const id = formData.get("id") as string;
  if (!id) return;

  const admin = createAdminClient();
  const { error } = await admin.from("affiliates").update({ status: "rejected" }).eq("id", id);
  if (error) {
    console.error("rejectAffiliateAction: update failed", error, { id });
  }

  revalidatePath("/admin/affiliates");
}

// Paiement réel effectué hors plateforme (virement/PayPal, voir
// payout_email) -- ce bouton marque juste ce qui a déjà été payé comme tel,
// aucun virement automatique déclenché depuis ici.
export async function markCommissionsPaidAction(formData: FormData) {
  await assertAdminSession();
  const affiliateId = formData.get("affiliateId") as string;
  if (!affiliateId) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("affiliate_commissions")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("affiliate_id", affiliateId)
    .eq("status", "pending");
  if (error) {
    console.error("markCommissionsPaidAction: update failed", error, { affiliateId });
  }

  revalidatePath("/admin/affiliates");
}
