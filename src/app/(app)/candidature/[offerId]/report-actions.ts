"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOfferLink } from "@/lib/offers/linkCheck";
import { OFFER_REPORT_EVENT, REPORT_WINDOW_MS, shouldRemoveOffer } from "@/lib/offers/reports";

export type ReportState = { status: "idle" | "removed" | "noted" | "error"; message: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// « Le lien ne marche pas / l'offre n'est plus disponible » (29/10) : on
// vérifie le lien, on retire l'offre si c'est confirmé, et l'offre sort du
// suivi de l'étudiant (« Abandonnée ou offre pourvue »).
export async function reportUnavailableOfferAction(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Session expirée : recharge la page." };
  const offerId = String(formData.get("offerId") ?? "");
  if (!UUID.test(offerId)) return { status: "error", message: "Offre introuvable." };

  const admin = createAdminClient();
  const { data: offer } = await admin.from("offers").select("id, source, external_id, apply_url, is_active").eq("id", offerId).maybeSingle();
  if (!offer) return { status: "error", message: "Offre introuvable." };

  const since = new Date(Date.now() - REPORT_WINDOW_MS).toISOString();
  const [verdict, { data: previous }] = await Promise.all([
    checkOfferLink(offer),
    admin.from("user_events").select("user_id").eq("event_type", OFFER_REPORT_EVENT).eq("metadata->>offerId", offerId).gte("created_at", since).limit(50),
  ]);
  const otherReporters = new Set((previous ?? []).map((e) => e.user_id).filter((id) => id !== user.id)).size;
  const remove = shouldRemoveOffer(verdict, otherReporters);

  if (remove && offer.is_active) {
    const { error } = await admin.from("offers").update({ is_active: false }).eq("id", offerId);
    if (error) console.error("reportUnavailableOffer: retrait en échec", error.message, { offerId });
  }
  // Sort du suivi de l'étudiant s'il ne l'avait pas encore envoyée.
  await admin.from("applications").update({ status: "cloturee" }).eq("user_id", user.id).eq("offer_id", offerId).eq("status", "a_preparer");
  let host: string | null = null;
  try {
    host = offer.apply_url ? new URL(offer.apply_url).hostname : null;
  } catch {
    host = null;
  }
  await admin.from("user_events").insert({
    user_id: user.id,
    event_type: OFFER_REPORT_EVENT,
    metadata: { offerId, verdict, removed: remove, source: offer.source, host, otherReporters },
  });
  revalidatePath("/favoris");
  revalidatePath("/mes-candidatures");
  revalidatePath(`/candidature/${offerId}`);
  return remove
    ? { status: "removed", message: "Merci ! C'est confirmé : l'offre n'est plus disponible, on l'a retirée de Stageio pour tout le monde." }
    : { status: "noted", message: "Merci, c'est noté. On vérifie cette offre ; si d'autres étudiants la signalent, elle sera retirée." };
}
