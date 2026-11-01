"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { isLinkedinFormat } from "@/lib/linkedin/formats";
import { prepareDraft, setPostStatus, type PostStatus, type PrepareResult } from "@/lib/linkedin/posts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function prepareDraftAction(input: {
  format: string;
  segment: string | null;
  offerIds: string[];
  linksInComment: boolean;
}): Promise<PrepareResult> {
  try {
    await assertAdminSession();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }
  if (!isLinkedinFormat(input.format)) return { ok: false, error: "Format inconnu." };
  const offerIds = (Array.isArray(input.offerIds) ? input.offerIds : []).filter((id) => typeof id === "string" && UUID.test(id));
  try {
    const result = await prepareDraft({
      format: input.format,
      segment: typeof input.segment === "string" ? input.segment : null,
      offerIds,
      linksInComment: Boolean(input.linksInComment),
    });
    if (result.ok) revalidatePath("/admin/linkedin");
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

export async function setPostStatusAction(id: string, status: PostStatus): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdminSession();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }
  if (!UUID.test(id) || !["brouillon", "publie", "abandonne"].includes(status)) return { ok: false, error: "Requête invalide." };
  try {
    await setPostStatus(id, status);
    revalidatePath("/admin/linkedin");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
