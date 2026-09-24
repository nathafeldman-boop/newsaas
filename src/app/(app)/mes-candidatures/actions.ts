"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import type { ApplicationStatus } from "@/types/database";

const VALID_STATUSES: ApplicationStatus[] = ["envoyee", "en_cours", "entretien", "acceptee", "refusee"];

// Avant cette action, "en_cours" et "acceptee" étaient des statuts définis
// dans le type mais jamais atteignables dans le produit : seule
// l'automatisation Gmail (sync-gmail-replies, opt-in et Gmail uniquement)
// pouvait faire passer une candidature à "entretien"/"refusee" -- tout le
// monde sans Gmail connecté restait bloqué sur "envoyee" pour toujours, même
// après une vraie réponse reçue par un autre canal (RETENTION_AUDIT.md,
// section "impasse du statut de candidature"). Contrairement au garde-fou
// isTerminal du cron Gmail (qui protège un statut terminal d'un écrasement
// AUTOMATISÉ ambigu), une correction MANUELLE de l'utilisateur sur sa propre
// candidature doit toujours pouvoir s'appliquer.
export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
): Promise<void> {
  if (!VALID_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .select("offer_id")
    .maybeSingle();

  if (error) {
    console.error("updateApplicationStatusAction failed", error, { applicationId, status, userId: user.id });
    return;
  }
  if (!data) return;

  await logServerEvent(supabase, user.id, "application_status_changed", {
    applicationId,
    status,
    offerId: data.offer_id,
  });

  revalidatePath("/mes-candidatures");
  revalidatePath("/dashboard");
  revalidatePath("/profil");
}
