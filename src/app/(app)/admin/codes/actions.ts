"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { assertAdmin } from "@/lib/admin/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  return randomBytes(5).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export async function createAccessCodeAction(formData: FormData) {
  const admin = await assertAdmin();
  const note = ((formData.get("note") as string) || "").trim() || null;
  const maxUses = Math.max(1, Number(formData.get("maxUses")) || 1);

  const db = createAdminClient();
  await db.from("access_codes").insert({
    code: generateCode(),
    note,
    max_uses: maxUses,
    created_by: admin.id,
  });

  revalidatePath("/admin/codes");
}

export async function deleteAccessCodeAction(formData: FormData) {
  await assertAdmin();
  const id = formData.get("id") as string;
  const db = createAdminClient();
  await db.from("access_codes").delete().eq("id", id);
  revalidatePath("/admin/codes");
}
