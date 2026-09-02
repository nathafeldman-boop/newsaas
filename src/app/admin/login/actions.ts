"use server";

import { redirect } from "next/navigation";
import {
  verifyAdminAccessCode,
  setAdminSessionCookie,
  clearAdminSessionCookie,
} from "@/lib/admin/accessCode";

export type AdminLoginState = { status: "idle" | "error"; message?: string };

export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const code = ((formData.get("code") as string) || "").trim();

  if (!code || !verifyAdminAccessCode(code)) {
    return { status: "error", message: "Code invalide." };
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
