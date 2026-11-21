import { createAdminClient } from "@/lib/supabase/admin";

// Simulation du parcours dans le dashboard (21/11, Nathan : « une simulation
// Premium et une pas Premium, 100 % exacte »). La vraie app tourne avec deux
// comptes de test, recréés à neuf à chaque départ (comme une vraie
// inscription), puis supprimés : tout ce qu'ils ont laissé (swipes,
// événements, candidatures) part avec eux (suppression en cascade), donc
// rien ne reste dans les stats. Seule différence avec le vrai : aucune
// candidature ni relance ne part chez un recruteur, et aucun e-mail ne part
// vers ces comptes.

export const SIMULATION_DOMAIN = "simulation.stageio.fr";
export type SimulationKind = "gratuit" | "premium";
const EMAIL: Record<SimulationKind, string> = {
  gratuit: `gratuit@${SIMULATION_DOMAIN}`,
  premium: `premium@${SIMULATION_DOMAIN}`,
};

/** Adresse d'un compte de simulation (rien ne doit partir vers lui ni en son nom). */
export function isSimulationEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(`@${SIMULATION_DOMAIN}`);
}

type Admin = ReturnType<typeof createAdminClient>;

async function findUserIds(admin: Admin): Promise<{ id: string; email: string }[]> {
  const { data, error } = await admin.from("profiles").select("id, email").like("email", `%@${SIMULATION_DOMAIN}`).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((p): p is { id: string; email: string } => isSimulationEmail(p.email));
}

/** Supprime les comptes de simulation et tout ce qu'ils ont laissé. */
export async function deleteSimulationAccounts(admin: Admin = createAdminClient()): Promise<number> {
  const users = await findUserIds(admin);
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw new Error(error.message);
  }
  return users.length;
}

/** Comptes de simulation encore là (une simulation pas terminée). */
export async function activeSimulation(admin: Admin = createAdminClient()): Promise<SimulationKind[]> {
  const users = await findUserIds(admin).catch(() => []);
  return (Object.keys(EMAIL) as SimulationKind[]).filter((k) => users.some((u) => u.email === EMAIL[k]));
}

/**
 * Recrée le compte à neuf (exactement comme une inscription) et renvoie de
 * quoi ouvrir sa session. Premium : accès à vie (comme après un paiement,
 * sans Stripe ni encaissement).
 */
export async function startSimulationAccount(kind: SimulationKind, admin: Admin = createAdminClient()): Promise<{ tokenHash: string }> {
  await deleteSimulationAccounts(admin);
  const email = EMAIL[kind];
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (createError || !created.user) throw new Error(createError?.message ?? "création du compte de simulation impossible");
  if (kind === "premium") {
    const { error } = await admin.from("profiles").update({ subscription_status: "lifetime" }).eq("id", created.user.id);
    if (error) throw new Error(error.message);
  }
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error(linkError?.message ?? "lien de connexion de simulation impossible");
  return { tokenHash };
}
