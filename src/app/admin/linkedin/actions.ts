"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePost, insertPost, setPublished } from "@/lib/linkedin/data";
import { cityFrom, sectorGroupFrom } from "@/lib/linkedin/format";
import { idsFrom, kindFrom } from "@/lib/linkedin/params";

// Actions de /admin/linkedin. Rien ne part sur LinkedIn : ces actions ne font
// que tenir l'historique (préparée, publiée, supprimée).

const MAX_POST_LENGTH = 3000; // limite de LinkedIn

function back(params: Record<string, string>): never {
  redirect(`/admin/linkedin?${new URLSearchParams(params).toString()}`);
}

export async function savePostAction(formData: FormData) {
  await assertAdminSession();
  const kind = kindFrom(formData.get("f"));
  const body = String(formData.get("text") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 5000) || null;
  const ids = idsFrom(String(formData.get("ids") ?? ""));
  const sector = sectorGroupFrom(formData.get("s"));
  const city = cityFrom(formData.get("v"));
  const label = String(formData.get("label") ?? "").trim().slice(0, 120);
  const here = { f: kind, ...(sector ? { s: sector.slug } : {}), ...(city ? { v: city.slug } : {}) };
  if (!body || ids.length === 0 || !label) back({ ...here, erreur: "Rien à enregistrer : texte ou offres manquants." });
  if (body.length > MAX_POST_LENGTH) back({ ...here, erreur: `Le texte fait ${body.length} caractères : LinkedIn en accepte ${MAX_POST_LENGTH} au plus.` });

  const saved = await insertPost(createAdminClient(), { kind, label, body, comment, offer_ids: ids });
  if ("error" in saved) {
    console.error("savePostAction failed", saved.error);
    back({ ...here, erreur: saved.tableMissing ? "missing_table" : "Enregistrement impossible, réessaie." });
  }
  back({ h: saved.id, ok: "Publication enregistrée : ses offres ne seront plus proposées pendant 60 jours." });
}

export async function markPublishedAction(formData: FormData) {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("url") ?? "").trim();
  let url: string | null = null;
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === "https:" && /(^|\.)linkedin\.com$/.test(parsed.hostname)) url = parsed.toString();
    } catch {
      // adresse invalide : ignorée plus bas
    }
    if (!url) back({ erreur: "Le lien doit être celui de la publication sur linkedin.com." });
  }
  const error = await setPublished(createAdminClient(), id, url);
  if (error) back({ erreur: "Mise à jour impossible, réessaie." });
  back({ ok: "Marquée comme publiée." });
}

export async function deletePostAction(formData: FormData) {
  await assertAdminSession();
  const error = await deletePost(createAdminClient(), String(formData.get("id") ?? ""));
  if (error) back({ erreur: "Suppression impossible, réessaie." });
  back({ ok: "Publication supprimée : ses offres peuvent de nouveau être proposées." });
}
