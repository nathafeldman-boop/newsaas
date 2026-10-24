import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import type { Range } from "@/lib/admin/cockpit/metrics";

// Lectures Supabase du cockpit : profils et usage du produit. Supabase est
// la source de vérité des comptes (inscription, dernière activité) et de
// l'usage (likes, candidatures) ; jamais des paiements (voir Stripe).

export type CockpitProfile = {
  id: string;
  email: string | null;
  created_at: string;
  last_active_at: string | null;
  total_paid_cents: number;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
  cv_uploaded_at: string | null;
};

const PROFILE_COLUMNS = "id, email, created_at, last_active_at, total_paid_cents, subscription_status, stripe_subscription_id, cv_uploaded_at";

export async function profilesByIds(ids: string[]): Promise<Map<string, CockpitProfile>> {
  const db = createAdminClient();
  const out = new Map<string, CockpitProfile>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).in("id", unique.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of (data ?? []) as CockpitProfile[]) out.set(p.id, p);
  }
  return out;
}

export type Usage = { likes: number; applications: number; lastSwipeAt: number | null };

/** Likes et candidatures des comptes donnés (clients payants : quelques centaines au plus). */
export async function usageByUser(ids: string[]): Promise<Map<string, Usage>> {
  const db = createAdminClient();
  const out = new Map<string, Usage>();
  const get = (id: string) => {
    let u = out.get(id);
    if (!u) {
      u = { likes: 0, applications: 0, lastSwipeAt: null };
      out.set(id, u);
    }
    return u;
  };
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const [swipes, apps] = await Promise.all([
      fetchAllRows<{ user_id: string; direction: string; created_at: string }>(
        (from, to) => db.from("swipes").select("user_id, direction, created_at").in("user_id", chunk).order("created_at").range(from, to),
        50_000,
        2,
      ),
      fetchAllRows<{ user_id: string }>((from, to) => db.from("applications").select("user_id").in("user_id", chunk).range(from, to), 20_000, 2),
    ]);
    for (const s of swipes) {
      const u = get(s.user_id);
      if (s.direction === "like") u.likes++;
      const t = Date.parse(s.created_at);
      if (u.lastSwipeAt === null || t > u.lastSwipeAt) u.lastSwipeAt = t;
    }
    for (const a of apps) get(a.user_id).applications++;
  }
  return out;
}

/** Comptes créés pendant la période (id seulement). */
export async function signupsIn(r: Range): Promise<string[]> {
  const db = createAdminClient();
  const rows = await fetchAllRows<{ id: string }>((from, to) =>
    db
      .from("profiles")
      .select("id")
      .gte("created_at", new Date(r.start).toISOString())
      .lt("created_at", new Date(r.end).toISOString())
      .order("created_at")
      .range(from, to),
  );
  return rows.map((r) => r.id);
}

/** Comptes dont la dernière activité est postérieure à t (seule la dernière activité est enregistrée). */
export async function activeSince(t: number): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", new Date(t).toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const getCancellationReasons = unstable_cache(
  async (sinceIso: string): Promise<{ reason: string; count: number }[]> => {
    const db = createAdminClient();
    const { data, error } = await db.from("subscription_cancellations").select("reason").gte("created_at", sinceIso).limit(5000);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const r of data ?? []) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
    return [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  },
  ["cockpit-cancellation-reasons-v1"],
  { revalidate: 1800 },
);

export type PremiumProfile = { id: string; email: string | null; subscription_status: string | null; current_period_end: string | null; stripe_subscription_id: string | null };

/** Comptes que la base considère payants ou en impayé (pour les comparer à Stripe). */
export async function premiumProfiles(): Promise<PremiumProfile[]> {
  const db = createAdminClient();
  return fetchAllRows<PremiumProfile>((from, to) =>
    db
      .from("profiles")
      .select("id, email, subscription_status, current_period_end, stripe_subscription_id")
      .in("subscription_status", ["active", "trialing", "past_due", "lifetime"])
      .order("id")
      .range(from, to),
  );
}
