"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { FOLLOW_UP_DAYS, STATUS_ORDER, isInvalidEnumError, isMissingColumnError, isSentStatus } from "@/lib/applications/status";
import type { Application, ApplicationStatus } from "@/types/database";

// Suivi des candidatures (24/10, mission churn). Chaque action renvoie
// ok / erreur : avant, un échec était silencieux et le menu affichait un
// statut qui n'avait jamais été enregistré.
//
// Historique : avant le sélecteur manuel, "en_cours" et "acceptee" étaient
// inatteignables -- seule l'automatisation Gmail (sync-gmail-replies, opt-in)
// faisait bouger un statut, tout le monde sans Gmail restait sur "envoyee"
// (RETENTION_AUDIT.md, « impasse du statut de candidature »). Une correction
// MANUELLE de l'étudiant sur sa propre candidature s'applique toujours,
// contrairement au garde-fou isTerminal du cron Gmail.
//
// Colonnes note / follow_up_at / sent_at et statuts a_preparer / cloturee :
// SQL du 24/10 lancé à la main. Tant qu'il ne l'est pas, les écritures
// retombent sur les seules colonnes d'origine.

export type ActionResult = { ok: true } | { ok: false; error: string };

const DAY_MS = 86_400_000;
const NOTE_MAX = 2000;
const NOT_READY = "Cette option arrive dans quelques minutes : réessaie un peu plus tard.";

function revalidateTracking() {
  revalidatePath("/mes-candidatures");
  revalidatePath("/favoris");
  revalidatePath("/dashboard");
  revalidatePath("/profil");
}

const hasTrackingColumns = (row: Partial<Application> | null) => !!row && "follow_up_at" in row;

const defaultFollowUp = (from: number) => new Date(from + FOLLOW_UP_DAYS * DAY_MS).toISOString();

export async function updateApplicationStatusAction(applicationId: string, status: ApplicationStatus): Promise<ActionResult> {
  if (!STATUS_ORDER.includes(status)) return { ok: false, error: "Statut inconnu." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi pour modifier ta candidature." };

  const { data: current } = await supabase.from("applications").select("*").eq("id", applicationId).eq("user_id", user.id).maybeSingle();
  if (!current) return { ok: false, error: "Candidature introuvable." };
  if (current.status === status) return { ok: true };

  const patch: Partial<Application> = { status };
  // Première fois qu'elle passe « envoyée » : date d'envoi, et relance
  // proposée 7 jours plus tard si l'étudiant n'en a pas choisi.
  if (hasTrackingColumns(current) && isSentStatus(status) && !current.sent_at) {
    const now = Date.now();
    patch.sent_at = new Date(now).toISOString();
    if (status === "envoyee" && !current.follow_up_at) patch.follow_up_at = defaultFollowUp(now);
  }

  const { error } = await supabase.from("applications").update(patch).eq("id", applicationId).eq("user_id", user.id);
  if (error) {
    console.error("updateApplicationStatusAction failed", error, { applicationId, status, userId: user.id });
    return { ok: false, error: isInvalidEnumError(error) ? NOT_READY : "Le statut n'a pas pu être enregistré. Réessaie." };
  }

  await logServerEvent(supabase, user.id, "application_status_changed", {
    applicationId,
    status,
    from: current.status,
    offerId: current.offer_id,
  });
  revalidateTracking();
  return { ok: true };
}

export async function updateApplicationDetailsAction(
  applicationId: string,
  details: { note?: string | null; followUpDate?: string | null },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi pour modifier ta candidature." };

  const patch: Partial<Application> = {};
  if (details.note !== undefined) {
    const note = (details.note ?? "").trim().slice(0, NOTE_MAX);
    patch.note = note || null;
  }
  if (details.followUpDate !== undefined) {
    if (details.followUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(details.followUpDate)) return { ok: false, error: "Date invalide." };
    // 6 h UTC : le matin à Paris, et le même jour affiché quel que soit le fuseau français.
    patch.follow_up_at = details.followUpDate ? `${details.followUpDate}T06:00:00.000Z` : null;
  }
  if (Object.keys(patch).length === 0) return { ok: true };

  const { data, error } = await supabase.from("applications").update(patch).eq("id", applicationId).eq("user_id", user.id).select("id").maybeSingle();
  if (error) {
    console.error("updateApplicationDetailsAction failed", error, { applicationId, userId: user.id });
    return { ok: false, error: isMissingColumnError(error) ? NOT_READY : "Pas enregistré. Réessaie." };
  }
  if (!data) return { ok: false, error: "Candidature introuvable." };

  // Jamais le contenu de la note : seulement ce qui a changé.
  await logServerEvent(supabase, user.id, "application_tracking_updated", {
    applicationId,
    fields: Object.keys(patch),
  });
  revalidateTracking();
  return { ok: true };
}

/**
 * « J'ai envoyé ma candidature » (page de l'offre, après « Postuler sur le
 * site ») : la seule façon de passer de « à envoyer » à « envoyée » sans
 * ouvrir le suivi. Ne fait jamais redescendre une candidature déjà plus loin
 * (entretien, réponse).
 */
export async function markApplicationSentAction(offerId: string): Promise<ActionResult & { sentAt?: string; followUpAt?: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi pour enregistrer ta candidature." };

  const now = Date.now();
  const sentAt = new Date(now).toISOString();
  const { data: current } = await supabase.from("applications").select("*").eq("user_id", user.id).eq("offer_id", offerId).maybeSingle();

  if (current && current.status !== "a_preparer" && current.status !== "envoyee") {
    return { ok: true, sentAt: current.sent_at ?? current.applied_at, followUpAt: current.follow_up_at ?? null };
  }
  if (current?.status === "envoyee" && (!hasTrackingColumns(current) || current.sent_at)) {
    return { ok: true, sentAt: current.sent_at ?? current.applied_at, followUpAt: current.follow_up_at ?? null };
  }

  const followUpAt = current?.follow_up_at ?? defaultFollowUp(now);
  const full: Partial<Application> = { status: "envoyee", sent_at: sentAt, follow_up_at: followUpAt };
  const write = (patch: Partial<Application>) =>
    current
      ? supabase.from("applications").update(patch).eq("id", current.id).eq("user_id", user.id)
      : supabase.from("applications").insert({ ...patch, user_id: user.id, offer_id: offerId });

  let { error } = await write(full);
  let tracked = true;
  if (error && isMissingColumnError(error)) {
    tracked = false;
    ({ error } = await write({ status: "envoyee" }));
  }
  if (error) {
    console.error("markApplicationSentAction failed", error, { offerId, userId: user.id });
    const premium = error.message?.includes("PREMIUM_REQUIRED");
    return { ok: false, error: premium ? "Le suivi des candidatures est réservé aux comptes Premium." : "Pas enregistré. Réessaie dans un instant." };
  }

  await logServerEvent(supabase, user.id, "application_marked_sent", { offerId, applicationId: current?.id ?? null });
  revalidateTracking();
  return { ok: true, sentAt, followUpAt: tracked ? followUpAt : null };
}
