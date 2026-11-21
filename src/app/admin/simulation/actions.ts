"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createClient } from "@/lib/supabase/server";
import { deleteSimulationAccounts, startSimulationAccount, type SimulationKind } from "@/lib/simulation/accounts";

// Démarre (ou recommence à zéro) une simulation : compte neuf, session
// ouverte dans ce navigateur, puis la vraie app s'affiche dans le cadre.
export async function startSimulationAction(formData: FormData) {
  await assertAdminSession();
  const kind: SimulationKind = formData.get("kind") === "premium" ? "premium" : "gratuit";
  let ok = true;
  try {
    const { tokenHash } = await startSimulationAccount(kind);
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("startSimulationAction failed", err);
    ok = false;
  }
  redirect(ok ? `/admin/simulation?mode=${kind}&t=${Date.now()}` : "/admin/simulation?erreur=1");
}

// Fin : session fermée, comptes supprimés avec tout ce qu'ils ont laissé.
export async function endSimulationAction() {
  await assertAdminSession();
  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => undefined);
  await deleteSimulationAccounts().catch((err) => console.error("endSimulationAction failed", err));
  redirect("/admin/simulation?fin=1");
}
