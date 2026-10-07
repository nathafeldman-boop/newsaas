"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { submitToIndexNow } from "@/lib/seo/indexNow";
import { collectIndexNowPaths } from "@/lib/seo/indexNowPaths";
import { SITE_URL } from "@/lib/site";

// Bouton admin : envoie d'un coup toutes les URLs indexables du site à
// IndexNow (Bing & co). Le cron /api/cron/indexnow envoie déjà chaque nuit
// ce qui a changé : le bouton ne sert plus qu'à forcer un envoi complet.
export async function submitIndexNowAction() {
  await assertAdminSession();
  let result: { submitted: number; error?: string };
  try {
    const paths = await collectIndexNowPaths();
    result = await submitToIndexNow(paths.map((path) => `${SITE_URL}${path === "/" ? "/" : path}`));
  } catch (err) {
    console.error("submitIndexNowAction failed", err);
    result = { submitted: 0, error: "Erreur pendant la collecte des URLs (voir les logs)." };
  }
  const params = new URLSearchParams({ indexnow: result.error ? "error" : "ok", count: String(result.submitted) });
  if (result.error) params.set("message", result.error);
  redirect(`/admin?${params.toString()}`);
}
