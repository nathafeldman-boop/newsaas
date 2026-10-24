"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { TEMPLATE_DOMAINS, TEMPLATE_STYLES } from "@/lib/coverLetter/templates";
import type { ActionResult } from "@/app/(app)/mes-candidatures/actions";

const LETTER_MAX = 8000;

/**
 * Enregistre la lettre de l'étudiant sur sa candidature (24/10). Avant,
 * seule la lettre générée était gardée : ses retouches disparaissaient en
 * quittant la page. `template` : la lettre vient de la bibliothèque de
 * modèles (compté dans le cockpit, sans le contenu).
 */
export async function saveCoverLetterAction(offerId: string, text: string, template?: { domain: string; style: string }): Promise<ActionResult> {
  const letter = text.trim().slice(0, LETTER_MAX);
  if (!letter) return { ok: false, error: "La lettre est vide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Reconnecte-toi pour enregistrer ta lettre." };

  const { data, error } = await supabase
    .from("applications")
    .update({ cover_note: letter })
    .eq("user_id", user.id)
    .eq("offer_id", offerId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("saveCoverLetterAction failed", error, { offerId, userId: user.id });
    return { ok: false, error: "Lettre non enregistrée. Copie-la avant de quitter la page." };
  }
  if (!data) return { ok: false, error: "Lettre non enregistrée : recharge la page puis réessaie." };

  if (template && TEMPLATE_DOMAINS.some((d) => d.id === template.domain) && TEMPLATE_STYLES.some((s) => s.id === template.style)) {
    await logServerEvent(supabase, user.id, "cover_letter_template_used", { offerId, domain: template.domain, style: template.style });
  }
  revalidatePath("/mes-candidatures");
  return { ok: true };
}
