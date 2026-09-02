"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function applyToOffer(offerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/candidature/${offerId}`);
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("apply_url")
    .eq("id", offerId)
    .single();

  // Candidater doit rester illimité même quota de swipe atteint : on insère
  // la candidature AVANT le swipe, pour que le trigger de quota
  // (enforce_swipe_quota) voie déjà l'application et laisse passer.
  await supabase.from("applications").upsert(
    { user_id: user.id, offer_id: offerId, status: "envoyee" },
    { onConflict: "user_id,offer_id" },
  );

  await supabase.from("swipes").upsert(
    { user_id: user.id, offer_id: offerId, direction: "like" },
    { onConflict: "user_id,offer_id" },
  );

  if (offer?.apply_url) {
    redirect(offer.apply_url);
  }

  redirect(`/candidature/${offerId}?postule=1`);
}
