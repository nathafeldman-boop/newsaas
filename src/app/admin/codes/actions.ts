"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  return randomBytes(5).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export async function createAccessCodeAction(formData: FormData) {
  await assertAdminSession();
  const note = ((formData.get("note") as string) || "").trim() || null;
  const maxUses = Math.max(1, Number(formData.get("maxUses")) || 1);

  const db = createAdminClient();
  const { error } = await db.from("access_codes").insert({
    code: generateCode(),
    note,
    max_uses: maxUses,
  });
  if (error) console.error("createAccessCodeAction: insert failed", error);

  revalidatePath("/admin/codes");
}

export async function deleteAccessCodeAction(formData: FormData) {
  await assertAdminSession();
  const id = formData.get("id") as string;
  const db = createAdminClient();
  const { error } = await db.from("access_codes").delete().eq("id", id);
  if (error) console.error("deleteAccessCodeAction: delete failed", error, { id });
  revalidatePath("/admin/codes");
}
