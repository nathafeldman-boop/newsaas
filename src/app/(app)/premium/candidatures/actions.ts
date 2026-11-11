"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startUpsellCheckout, UPSELL_PAGE } from "@/lib/stripe/startUpsellCheckout";

// Achat d'un pack de candidatures ou de la levée de pause (upsell du 11/11).
export async function buyUpsellAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${UPSELL_PAGE}`);

  const result = await startUpsellCheckout({ id: user.id, email: user.email ?? null }, formData.get("kind"), formData.get("pack"));
  if ("error" in result) redirect(result.error === "premium_required" ? "/premium" : `${UPSELL_PAGE}?error=${result.error}`);
  redirect(result.url);
}
