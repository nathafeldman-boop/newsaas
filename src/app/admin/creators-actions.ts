"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTikTokList } from "@/lib/creators/tiktokViews";
import { refreshCreatorVideos } from "@/lib/creators/store";

// Liens TikTok des créateurs collés dans la vue d'ensemble (un par ligne).
// Premier relevé tout de suite, puis toutes les 3 h par le cron.
export async function addCreatorVideosAction(formData: FormData) {
  await assertAdminSession();
  const { valid, invalid } = parseTikTokList(String(formData.get("links") ?? ""));
  const creator = String(formData.get("creator") ?? "").trim().replace(/^@/, "").toLowerCase().slice(0, 60) || null;
  const back = (q: string) => redirect(`/admin?${q}#createurs`);
  if (valid.length === 0) back(`createurs=invalide&n=${invalid.length}`);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("creator_videos")
    .upsert(
      valid.map((v) => ({ url: v.url, creator: creator ?? v.creator })),
      { onConflict: "url", ignoreDuplicates: true },
    )
    .select("id");
  if (error) {
    console.error("addCreatorVideosAction failed", error);
    back(`createurs=${error.code === "42P01" || error.code === "PGRST205" ? "table" : "erreur"}`);
  }
  const ids = (data ?? []).map((r) => r.id);
  if (ids.length > 0) await refreshCreatorVideos(ids).catch((err) => console.error("premier relevé TikTok en échec", err));
  revalidatePath("/admin");
  back(`createurs=ok&n=${ids.length}&ko=${invalid.length}`);
}

export async function removeCreatorVideoAction(formData: FormData) {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const { error } = await createAdminClient().from("creator_videos").delete().eq("id", id);
    if (error) console.error("removeCreatorVideoAction failed", error);
  }
  revalidatePath("/admin");
  redirect("/admin#createurs");
}
