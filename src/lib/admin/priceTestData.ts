import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { FLASH_OFFER } from "@/lib/pricing/plans";

// Événements d'une période de test (onglet Tests) : qui a vu le paywall, qui
// a ouvert le paiement, et qui avait une offre 48 h par email ouverte (prix
// à part, mis de côté pour comparer les prix du paywall seuls). Lus par
// l'index (event_type, created_at), en cache 10 minutes.

export type ArmEvents = { viewers: string[]; checkouts: string[]; emailOffer: string[] };

export const loadArmEvents = unstable_cache(
  async (startIso: string, endIso: string): Promise<ArmEvents> => {
    const db = createAdminClient();
    const rows = await fetchAllRowsByIdCursor<{ id: string; user_id: string; event_type: string }>((afterId, limit) => {
      let q = db
        .from("user_events")
        .select("id, user_id, event_type")
        .in("event_type", ["paywall_viewed", "checkout_opened"])
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("id")
        .limit(limit);
      if (afterId) q = q.gt("id", afterId);
      return q;
    }, 200_000);
    const viewers = new Set<string>();
    const checkouts = new Set<string>();
    for (const r of rows) (r.event_type === "paywall_viewed" ? viewers : checkouts).add(r.user_id);

    // Offre 48 h ouverte pendant la période : email de la série (flash) reçu
    // dans les 48 h avant la période ou pendant. Cherché parmi les personnes
    // de la période seulement (index user_id).
    const emailOffer = await emailOfferAmong([...new Set([...viewers, ...checkouts])], startIso, endIso);
    return { viewers: [...viewers], checkouts: [...checkouts], emailOffer: [...emailOffer] };
  },
  ["admin-price-test-arm-v1"],
  { revalidate: 600 },
);

/** Payeurs (comptes) qui avaient une offre 48 h par email ouverte pendant la période. */
export async function emailOfferAmong(userIds: string[], startIso: string, endIso: string): Promise<Set<string>> {
  const db = createAdminClient();
  const out = new Set<string>();
  const since = new Date(Date.parse(startIso) - FLASH_OFFER.windowMs).toISOString();
  for (let i = 0; i < userIds.length; i += 200) {
    const { data, error } = await db
      .from("user_events")
      .select("user_id")
      .eq("event_type", SALES_SERIES_EVENT)
      .eq("metadata->>flash", "true")
      .in("user_id", userIds.slice(i, i + 200))
      .gte("created_at", since)
      .lt("created_at", endIso)
      .limit(5000);
    if (error) throw new Error(error.message);
    for (const e of data ?? []) out.add(e.user_id);
  }
  return out;
}
