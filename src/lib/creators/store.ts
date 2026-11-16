import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatorVideo } from "@/types/database";
import { creatorFromUrl, fetchTikTokViews, parseTikTokUrl, type ViewSnapshot } from "@/lib/creators/tiktokViews";

// Vidéos relevées : celles ajoutées depuis moins de 60 jours (au-delà, une
// vidéo TikTok ne bouge presque plus et chaque relevé coûte du temps de calcul).
export const TRACK_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Relève les vues de chaque vidéo suivie, 4 à la fois. */
export async function refreshCreatorVideos(onlyIds?: string[]): Promise<{ checked: number; failed: number }> {
  const admin = createAdminClient();
  let query = admin.from("creator_videos").select("*").gte("added_at", new Date(Date.now() - TRACK_DAYS * DAY_MS).toISOString());
  if (onlyIds) query = query.in("id", onlyIds);
  const { data: videos, error } = await query.limit(500);
  if (error) throw new Error(error.message);

  let checked = 0;
  let failed = 0;
  const queue = [...(videos ?? [])];
  const worker = async () => {
    for (let v = queue.shift(); v; v = queue.shift()) {
      const res = await fetchTikTokViews(v.url);
      const now = new Date().toISOString();
      if ("error" in res) {
        failed += 1;
        await admin.from("creator_videos").update({ last_error: res.error.slice(0, 300) }).eq("id", v.id);
        continue;
      }
      checked += 1;
      // Lien court : on garde le lien complet trouvé après redirection.
      const canonical = parseTikTokUrl(res.finalUrl);
      const patch: Partial<CreatorVideo> = { views: res.views, checked_at: now, last_error: null };
      if (canonical && canonical.url !== v.url && canonical.creator) patch.url = canonical.url;
      if (!v.creator) patch.creator = creatorFromUrl(res.finalUrl);
      const { error: upErr } = await admin.from("creator_videos").update(patch).eq("id", v.id);
      // Le lien complet existe déjà (même vidéo collée deux fois) : on garde l'ancien lien.
      if (upErr && patch.url) await admin.from("creator_videos").update({ ...patch, url: v.url }).eq("id", v.id);
      await admin.from("creator_video_views").insert({ video_id: v.id, checked_at: now, views: res.views });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return { checked, failed };
}

export type CreatorData = { videos: CreatorVideo[]; snapshots: ViewSnapshot[]; missingTable: boolean };

export async function loadCreatorData(): Promise<CreatorData> {
  const admin = createAdminClient();
  const [{ data: videos, error }, { data: snapshots, error: snapErr }] = await Promise.all([
    admin.from("creator_videos").select("*").order("added_at", { ascending: false }).limit(500),
    admin.from("creator_video_views").select("video_id, checked_at, views").order("checked_at").limit(20_000),
  ]);
  const missing = (e: { code?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205");
  if (missing(error) || missing(snapErr)) return { videos: [], snapshots: [], missingTable: true };
  if (error) throw new Error(error.message);
  if (snapErr) throw new Error(snapErr.message);
  return { videos: videos ?? [], snapshots: snapshots ?? [], missingTable: false };
}
