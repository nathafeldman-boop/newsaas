"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentCreator, isValidInvite, newAccessToken, setCreatorCookie } from "@/lib/creators/access";
import { parseTikTokList, creatorFromUrl } from "@/lib/creators/tiktokViews";
import { refreshCreatorVideos } from "@/lib/creators/store";
import { needsReview } from "@/lib/creators/earnings";
import { CREATOR_ACCENTS } from "@/lib/creators/accents";

// Espace créateurs (18/11) : inscription, liens de vidéos, face / faceless,
// couleur du dashboard. Tout passe par la clé service, pour le compte du
// créateur du cookie seulement.

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const fr = digits.replace(/^\+33/, "0").replace(/^0033/, "0");
  if (/^0[1-9]\d{8}$/.test(fr)) return fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}

export async function signupCreatorAction(formData: FormData) {
  // Inscription ouverte (19/11) : l'ancien lien d'invitation reste accepté
  // mais n'est plus obligatoire. Les gains restent validés par Stageio.
  const i = String(formData.get("i") ?? "");
  const invite = isValidInvite(i) ? i : "";
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const handle = String(formData.get("tiktok") ?? "").trim().replace(/^@/, "").toLowerCase().slice(0, 40) || null;
  if (name.length < 2) redirect(`/createurs/inscription?${invite ? `i=${invite}&` : ""}erreur=nom`);
  if (!phone) redirect(`/createurs/inscription?${invite ? `i=${invite}&` : ""}erreur=tel`);
  const { token, hash } = newAccessToken();
  const { error } = await createAdminClient().from("creators").insert({ name, phone: phone!, tiktok_handle: handle, access_token_hash: hash });
  if (error) {
    console.error("créateurs : inscription impossible", error.message);
    redirect(`/createurs/inscription?${invite ? `i=${invite}&` : ""}erreur=base`);
  }
  await setCreatorCookie(token);
  redirect("/createurs?bienvenue=1");
}

async function me() {
  const session = await currentCreator();
  if (!session) redirect("/createurs");
  return session.creator;
}

export async function addCreatorVideoAction(formData: FormData) {
  const creator = await me();
  const { valid, invalid } = parseTikTokList(String(formData.get("links") ?? ""));
  if (valid.length === 0) redirect(`/createurs?ajout=invalide&n=${invalid.length}`);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("creator_videos")
    .upsert(
      valid.map((v) => ({ url: v.url, creator: v.creator ?? creator.tiktok_handle, creator_id: creator.id })),
      { onConflict: "url", ignoreDuplicates: true },
    )
    .select("id");
  if (error) {
    console.error("créateurs : ajout de vidéo impossible", error.message);
    redirect("/createurs?ajout=erreur");
  }
  const ids = (data ?? []).map((r) => r.id);
  // Premier relevé tout de suite : vues, et carrousel ou vidéo.
  if (ids.length > 0) await refreshCreatorVideos(ids).catch((err) => console.error("créateurs : premier relevé en échec", err));
  if (!creator.tiktok_handle && valid[0]?.creator) await admin.from("creators").update({ tiktok_handle: creatorFromUrl(valid[0].url) }).eq("id", creator.id);
  revalidatePath("/createurs");
  redirect(`/createurs?ajout=ok&n=${ids.length}&deja=${valid.length - ids.length}&ko=${invalid.length}#videos`);
}

/** Face ou faceless, dit par le créateur pour une vidéo (pas un carrousel). */
export async function declareFaceAction(formData: FormData) {
  const creator = await me();
  const id = String(formData.get("id") ?? "");
  const face = String(formData.get("face") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || (face !== "face" && face !== "faceless")) redirect("/createurs#videos");
  const admin = createAdminClient();
  const { data: v } = await admin.from("creator_videos").select("id, kind, declared_face, video_seq, review_status").eq("id", id).eq("creator_id", creator.id).maybeSingle();
  if (!v || v.kind !== "video") redirect("/createurs#videos");
  // Déjà validée par Stageio : on ne change plus.
  if (v!.review_status === "approved" || v!.review_status === "corrected") redirect("/createurs#videos");
  let seq = v!.video_seq ?? null;
  if (seq === null) {
    const { count } = await admin.from("creator_videos").select("id", { count: "exact", head: true }).eq("creator_id", creator.id).eq("kind", "video").not("video_seq", "is", null);
    seq = (count ?? 0) + 1;
  }
  await admin
    .from("creator_videos")
    .update({ declared_face: face as "face" | "faceless", video_seq: seq, review_status: needsReview(seq) ? "pending" : "none" })
    .eq("id", id)
    .eq("creator_id", creator.id);
  revalidatePath("/createurs");
  redirect("/createurs#videos");
}

export async function removeCreatorVideoAction(formData: FormData) {
  const creator = await me();
  const id = String(formData.get("id") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    // Une vidéo déjà validée reste (elle sert au calcul de la boucle 1 sur 5).
    await createAdminClient().from("creator_videos").delete().eq("id", id).eq("creator_id", creator.id).in("review_status", ["none", "pending"]);
  }
  revalidatePath("/createurs");
  redirect("/createurs#videos");
}

export async function setCreatorAccentAction(accent: string) {
  const session = await currentCreator();
  if (!session || !CREATOR_ACCENTS.some((a) => a.id === accent)) return;
  await createAdminClient().from("creators").update({ accent }).eq("id", session.creator.id);
}
