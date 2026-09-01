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

  await supabase.from("swipes").upsert(
    { user_id: user.id, offer_id: offerId, direction: "like" },
    { onConflict: "user_id,offer_id" },
  );

  await supabase.from("applications").upsert(
    { user_id: user.id, offer_id: offerId, status: "envoyee" },
    { onConflict: "user_id,offer_id" },
  );

  if (offer?.apply_url) {
    redirect(offer.apply_url);
  }

  redirect(`/candidature/${offerId}?postule=1`);
}
