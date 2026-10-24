import { createAdminClient } from "@/lib/supabase/admin";
import { inboxDomain } from "@/lib/inbox/address";

// Pourquoi Stageio Auto n'est pas proposée (25/10 : Nathan ne voyait pas les
// offres à 17,99 € et 80 €). Elle n'apparaît que si la colonne premium_tier
// existe (SQL du 24/10) et si INBOX_DOMAIN est réglé dans Vercel (voir
// isAutoOfferAvailable) ; on dit lequel des deux manque.
export async function autoOfferBlockers(): Promise<string[]> {
  const blockers: string[] = [];
  const { error } = await createAdminClient().from("profiles").select("premium_tier").limit(1);
  if (error && (error.code === "42703" || error.code === "PGRST204" || /premium_tier/.test(error.message))) {
    blockers.push("le SQL du 24/10 n'a pas été exécuté (colonne premium_tier absente)");
  } else if (error) {
    blockers.push(`lecture de la base impossible pour vérifier (${error.message})`);
  }
  if (!inboxDomain()) blockers.push("INBOX_DOMAIN n'est pas réglé dans Vercel (candidat.stageio.fr), puis redéployer");
  return blockers;
}
