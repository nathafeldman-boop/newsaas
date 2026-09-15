"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";

export async function moderateReviewAction(formData: FormData) {
  await assertAdminSession();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (status !== "approved" && status !== "rejected") return;

  const db = createAdminClient();
  const { error } = await db.from("reviews").update({ status }).eq("id", id);
  if (error) console.error("moderateReviewAction: update failed", error, { id, status });

  revalidatePath("/admin");
}
