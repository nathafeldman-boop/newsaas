"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTikTokList } from "@/lib/creators/tiktokViews";
import { refreshCreatorVideos } from "@/lib/creators/store";
import { parseRpm } from "@/lib/creators/rates";

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

// Validation face / faceless d'une vidéo de créateur (18/11) : la 1re vidéo
// puis une sur cinq arrivent ici. « approved » : le type déclaré est le bon ;
// « corrected » : Stageio met l'autre type (le tarif suit).
export async function reviewCreatorVideoAction(formData: FormData) {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "");
  const face = String(formData.get("face") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(id) && (face === "face" || face === "faceless")) {
    const admin = createAdminClient();
    const { data: v } = await admin.from("creator_videos").select("declared_face").eq("id", id).maybeSingle();
    if (v) {
      const { error } = await admin
        .from("creator_videos")
        .update({ approved_face: face, review_status: v.declared_face === face ? "approved" : "corrected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) console.error("reviewCreatorVideoAction failed", error);
    }
  }
  revalidatePath("/admin/createurs");
  redirect("/admin/createurs#a-valider");
}

// RPM des créateurs réglé par Nathan (21/11) : tarifs par défaut, en euros
// pour 1 000 vues. S'applique à toutes les vues, passées comprises.
export async function saveRpmDefaultsAction(formData: FormData) {
  await assertAdminSession();
  const carousel = parseRpm(formData.get("carousel"));
  const faceless = parseRpm(formData.get("faceless"));
  const face = parseRpm(formData.get("face"));
  if (typeof carousel !== "number" || typeof faceless !== "number" || typeof face !== "number") redirect("/admin/createurs?rpm=invalide#rpm");
  const { error } = await createAdminClient()
    .from("creator_rpm")
    .upsert({ id: 1, carousel, faceless, face, updated_at: new Date().toISOString() });
  if (error) console.error("saveRpmDefaultsAction failed", error);
  revalidatePath("/admin/createurs");
  revalidatePath("/admin");
  redirect(`/admin/createurs?rpm=${error ? "erreur" : "ok"}#rpm`);
}

// Tarif propre à un créateur : case vide = tarif par défaut.
export async function saveCreatorRpmAction(formData: FormData) {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "");
  const carousel = parseRpm(formData.get("carousel"));
  const faceless = parseRpm(formData.get("faceless"));
  const face = parseRpm(formData.get("face"));
  if (!/^[0-9a-f-]{36}$/i.test(id) || carousel === undefined || faceless === undefined || face === undefined) {
    redirect("/admin/createurs?rpm=invalide#createurs-inscrits");
  }
  const { error } = await createAdminClient()
    .from("creators")
    .update({ rpm_carousel: carousel, rpm_faceless: faceless, rpm_face: face })
    .eq("id", id);
  if (error) console.error("saveCreatorRpmAction failed", error);
  revalidatePath("/admin/createurs");
  revalidatePath("/admin");
  redirect(`/admin/createurs?rpm=${error ? "erreur" : "ok"}#createurs-inscrits`);
}
