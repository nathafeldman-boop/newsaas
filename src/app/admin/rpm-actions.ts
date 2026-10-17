"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";

// Saisie des vues (SOP 16) : « vues des 7 derniers jours » pour une source
// (utm_source du lien du créateur ou du compte), à la date de saisie. Une
// nouvelle saisie le même jour pour la même source remplace l'ancienne.
export async function saveContentViewsAction(formData: FormData) {
  await assertAdminSession();
  const source = String(formData.get("source") ?? "").trim().toLowerCase().slice(0, 80);
  const views = Number.parseInt(String(formData.get("views") ?? "").replace(/[\s.]/g, ""), 10);
  const recordedOn = String(formData.get("recorded_on") ?? "");
  if (!source || !Number.isFinite(views) || views < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn)) {
    redirect("/admin/rpm?error=invalid");
  }

  const { error } = await createAdminClient()
    .from("content_views")
    .upsert({ recorded_on: recordedOn, source, views }, { onConflict: "recorded_on,source" });
  if (error) {
    console.error("saveContentViewsAction failed", error);
    redirect(`/admin/rpm?error=${error.code === "42P01" || error.code === "PGRST205" ? "missing_table" : "save"}`);
  }
  revalidatePath("/admin/rpm");
  redirect("/admin/rpm?saved=1");
}
