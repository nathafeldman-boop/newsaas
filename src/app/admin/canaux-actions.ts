"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHANNELS_TAG } from "@/lib/admin/channelsData";

// Vues d'un jour pour un canal (« TikTok · commentaire »…), pour le RPM de
// la page Canaux. Une nouvelle saisie du même jour et du même canal
// remplace l'ancienne.
export async function saveChannelViewsAction(formData: FormData) {
  await assertAdminSession();
  const channel = String(formData.get("channel") ?? "").trim().slice(0, 80);
  const views = Number.parseInt(String(formData.get("views") ?? "").replace(/[\s.]/g, ""), 10);
  const day = String(formData.get("day") ?? "");
  const period = String(formData.get("p") ?? "30");
  const back = (q: string) => `/admin/canaux?p=${encodeURIComponent(period)}&${q}`;
  if (!channel || !Number.isFinite(views) || views < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(day)) redirect(back("error=invalid"));

  const { error } = await createAdminClient().from("channel_views").upsert({ day, channel, views }, { onConflict: "day,channel" });
  if (error) {
    console.error("saveChannelViewsAction failed", error);
    redirect(back(`error=${error.code === "42P01" || error.code === "PGRST205" ? "missing_table" : "save"}`));
  }
  revalidateTag(CHANNELS_TAG, { expire: 0 });
  redirect(back("saved=1"));
}
