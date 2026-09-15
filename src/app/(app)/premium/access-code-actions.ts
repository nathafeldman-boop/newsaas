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

  // .eq("use_count", code.use_count) verrouille optimistiquement : si un
  // autre utilisateur a redeemé ce même code entre notre lecture et cet
  // update, cette clause ne matche plus rien -- on le détecte via
  // updatedCode plutôt que de risquer de dépasser max_uses en silence.
  const { data: updatedCode, error: codeUpdateError } = await admin
    .from("access_codes")
    .update({ use_count: code.use_count + 1 })
    .eq("id", code.id)
    .eq("use_count", code.use_count)
    .select("id")
    .maybeSingle();

  if (codeUpdateError || !updatedCode) {
    console.error("redeemAccessCodeAction: access_codes update failed", codeUpdateError, {
      codeId: code.id,
      userId: user.id,
    });
    return { status: "error", message: "Ce code vient d'être utilisé, réessaie dans un instant." };
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ subscription_status: "comp", premium_activated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileUpdateError) {
    // Ne jamais renvoyer "success" ici : supabase-js ne throw pas sur une
    // erreur Postgres, donc sans ce check l'utilisateur se voit annoncer
    // "Premium débloqué" alors que son compte n'a jamais été activé (déjà
    // arrivé en prod avec last_active_path -- voir (app)/layout.tsx).
    console.error("redeemAccessCodeAction: profile update failed", profileUpdateError, {
      codeId: code.id,
      userId: user.id,
    });
    return {
      status: "error",
      message: "Ton code a été validé mais l'activation a échoué -- contacte le support, on va régler ça.",
    };
  }

  return { status: "success", message: "Premium débloqué 🎉" };
}
