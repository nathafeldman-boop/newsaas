"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Écran de fin du paquet d'un abonné « Sur place uniquement » (4/11) : plus
// d'offres près de chez lui, il choisit d'ouvrir sa recherche à toute la
// France en un geste, sans passer par son profil. Son choix, jamais fait à sa
// place : le paquet ne sort de sa zone que s'il appuie.
export async function widenSearchToFranceAction(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from("profiles").update({ mobility: "Mobile en France" }).eq("id", user.id);
  if (error) {
    console.error("widenSearchToFranceAction failed", error.message, { userId: user.id });
    return { ok: false };
  }
  revalidatePath("/swipe");
  return { ok: true };
}
