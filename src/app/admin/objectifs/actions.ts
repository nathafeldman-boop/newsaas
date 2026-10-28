"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";

// Objectif d'un mois (26/10, Nathan : « pour la nouvelle année, on pourra
// nous-mêmes définir nos objectifs »). Un nouvel objectif pour un mois
// remplace l'ancien ; 0 € l'efface.
export async function saveGoalAction(formData: FormData) {
  await assertAdminSession();
  const month = String(formData.get("month") ?? "");
  const euros = Number(String(formData.get("amount") ?? "").replace(/[\s €]/g, "").replace(",", "."));
  if (!/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(euros) || euros < 0 || euros > 10_000_000) {
    redirect("/admin/objectifs?error=invalid");
  }
  const db = createAdminClient();
  const { error } =
    euros === 0
      ? await db.from("revenue_goals").delete().eq("month", month)
      : await db.from("revenue_goals").upsert({ month, target_cents: Math.round(euros * 100), updated_at: new Date().toISOString() }, { onConflict: "month" });
  if (error) {
    console.error("saveGoalAction failed", error);
    redirect(`/admin/objectifs?m=${month}&error=${error.code === "42P01" || error.code === "PGRST205" ? "missing_table" : "save"}`);
  }
  revalidatePath("/admin/objectifs");
  redirect(`/admin/objectifs?m=${month}&saved=1`);
}
