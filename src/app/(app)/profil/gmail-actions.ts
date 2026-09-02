"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function disconnectGmailAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("email_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "gmail");

  revalidatePath("/profil");
}
