import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { heardFromLabel } from "@/lib/onboarding/options";
import { isPremium } from "@/lib/subscription/isPremium";
import type { Profile } from "@/types/database";

// Lectures des pages de détail de l'admin (25/10, « je clique sur un jour, je
// veux tout savoir sur les inscrits de ce jour-là ») : les comptes d'une
// période et, pour chacun, ce qu'il a déclaré à l'onboarding, s'il a vu la
// page Premium, ouvert le paiement, payé.

export type Journey = { heard: string | null; paywall: number; checkout: number };

/** Comptes créés entre start et end (ms), du plus récent au plus ancien. */
export async function profilesCreatedBetween(start: number, end: number, max = 5000): Promise<Profile[]> {
  const db = createAdminClient();
  return fetchAllRows<Profile>(
    (from, to) =>
      db
        .from("profiles")
        .select("*")
        .gte("created_at", new Date(start).toISOString())
        .lt("created_at", new Date(end).toISOString())
        .order("created_at", { ascending: false })
        .range(from, to),
    max,
  );
}

/** Réponse « Tu nous as connus comment ? » (la plus récente) et passages par Premium / paiement, par compte. */
export async function journeys(ids: string[]): Promise<Map<string, Journey>> {
  const db = createAdminClient();
  const out = new Map<string, Journey>(ids.map((id) => [id, { heard: null, paywall: 0, checkout: 0 }]));
  const heardAt = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const rows = await fetchAllRows<{ user_id: string; event_type: string; metadata: unknown; created_at: string }>((from, to) =>
      db
        .from("user_events")
        .select("user_id, event_type, metadata, created_at")
        .in("user_id", chunk)
        .in("event_type", ["heard_from", "paywall_viewed", "checkout_opened"])
        .range(from, to),
    );
    for (const e of rows) {
      const j = out.get(e.user_id);
      if (!j) continue;
      if (e.event_type === "paywall_viewed") j.paywall++;
      else if (e.event_type === "checkout_opened") j.checkout++;
      else {
        const meta = e.metadata as { source?: unknown; format?: unknown } | null;
        if (typeof meta?.source !== "string") continue;
        const prev = heardAt.get(e.user_id);
        if (prev && prev > e.created_at) continue;
        heardAt.set(e.user_id, e.created_at);
        j.heard = heardFromLabel(meta.source, typeof meta.format === "string" ? meta.format : null);
      }
    }
  }
  return out;
}

/** A payé au moins une fois (accès payant en cours ou paiement noté ; un accès offert par code ne compte pas). */
export function hasPaid(p: Profile): boolean {
  return (isPremium(p) && p.subscription_status !== "comp") || (p.total_paid_cents ?? 0) > 0;
}
