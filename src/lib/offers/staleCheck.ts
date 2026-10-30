import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchFranceTravailOfferStatus } from "@/lib/franceTravail/client";

// Offres pourvues retirées avant que l'étudiant tombe dessus (30/10,
// commentaires de résiliation Stripe des 25 et 26/10 : « Toutes les offres
// ne sont plus disponibles », « les sites sont inaccessibles, on me dit
// l'offre n'est plus disponible ou erreur »). Une offre France Travail
// pourvue disparaît de leurs résultats, mais restait active chez nous
// jusqu'à ses 30 jours (deactivate-expired-offers ne retire que les offres
// de plus de 30 jours non revues depuis 5 jours). Chaque nuit : les offres
// que la synchro n'a pas revues depuis 36 h sont vérifiées une par une
// auprès de l'API France Travail ; « n'existe plus » → retirée, « en
// ligne » → notée comme revue. Sur un doute (API lente ou en erreur), rien
// ne change.

type Admin = ReturnType<typeof createAdminClient>;

export const UNSEEN_CHECK_HOURS = 36;
const MAX_CHECKS = 800;

export async function verifyUnseenFranceTravailOffers(admin: Admin, deadline: number, now = Date.now()) {
  const summary = { candidates: 0, checked: 0, gone: 0, live: 0, unknown: 0 };
  const { data, error } = await admin
    .from("offers")
    .select("id, external_id")
    .eq("source", "france_travail")
    .eq("is_active", true)
    .not("external_id", "is", null)
    .lt("last_seen_at", new Date(now - UNSEEN_CHECK_HOURS * 3_600_000).toISOString())
    .order("published_at", { ascending: false })
    .limit(MAX_CHECKS);
  if (error) throw new Error(error.message);
  summary.candidates = data?.length ?? 0;
  const gone: string[] = [];
  const live: string[] = [];
  for (const offer of data ?? []) {
    if (Date.now() > deadline) break;
    const status = await fetchFranceTravailOfferStatus(offer.external_id as string, 4000);
    summary.checked++;
    if (status === "gone") gone.push(offer.id);
    else if (status === "live") live.push(offer.id);
    else summary.unknown++;
  }
  for (let i = 0; i < gone.length; i += 200) {
    const { error: e } = await admin.from("offers").update({ is_active: false }).in("id", gone.slice(i, i + 200));
    if (e) throw new Error(e.message);
  }
  const seenAt = new Date(now).toISOString();
  for (let i = 0; i < live.length; i += 200) {
    const { error: e } = await admin.from("offers").update({ last_seen_at: seenAt }).in("id", live.slice(i, i + 200));
    if (e) throw new Error(e.message);
  }
  summary.gone = gone.length;
  summary.live = live.length;
  return summary;
}
