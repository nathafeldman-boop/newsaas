"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RedeemCodeState = { status: "idle" | "success" | "error"; message?: string };

export async function redeemAccessCodeAction(
  _prevState: RedeemCodeState,
  formData: FormData,
): Promise<RedeemCodeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Connecte-toi d'abord." };
  }

  const rawCode = ((formData.get("code") as string) || "").trim().toUpperCase();
  if (!rawCode) {
    return { status: "error", message: "Entre un code." };
  }

  const admin = createAdminClient();
  const { data: code } = await admin
    .from("access_codes")
    .select("*")
    .eq("code", rawCode)
    .maybeSingle();

  if (!code) {
    return { status: "error", message: "Code invalide." };
  }

  if (code.use_count >= code.max_uses) {
    return { status: "error", message: "Ce code a déjà été utilisé le nombre de fois maximum." };
  }

  const { error: redemptionError } = await admin
    .from("access_code_redemptions")
    .insert({ code_id: code.id, user_id: user.id });

  if (redemptionError) {
    return { status: "error", message: "Tu as déjà utilisé ce code." };
  }

  await admin.from("access_codes").update({ use_count: code.use_count + 1 }).eq("id", code.id);
  await admin
    .from("profiles")
    .update({ subscription_status: "comp", premium_activated_at: new Date().toISOString() })
    .eq("id", user.id);

  return { status: "success", message: "Premium débloqué 🎉" };
}
