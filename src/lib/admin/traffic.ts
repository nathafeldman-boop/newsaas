import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { paidSubs } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import { aggregateSignups, dayKey, sourceKey, type SignupDay, type SignupRow } from "@/lib/admin/trafficStats";

// Trafic du site (24/10, demande de Nathan : « combien de personnes sont
// venues aujourd'hui, combien sont en ligne, d'où elles viennent, TikTok ou
// Instagram »). Depuis le 25/10, uniquement des inscrits (Nathan : « les
// visiteurs, ça peut être des robots Google ; ne compte que les inscrits ») :
// plus aucun compte de visiteurs anonymes (site_visits) dans l'admin.
//
// Inscrits : profiles.created_at, source = utm_source posé à l'inscription
// (cookie de 30 jours : la source du premier lien, pas forcément du dernier).
// Calculs purs (sources, jours, rapprochements) : lib/admin/trafficStats.ts.

/**
 * En ligne (25/10, Nathan : « les visiteurs, ça peut être des robots Google,
 * compte que les inscrits ») : comptes actifs dans l'appli dans les 3
 * dernières minutes (même fenêtre que la page « En ligne »), et depuis
 * minuit. Les visiteurs sans compte ne comptent plus ici.
 */
export async function onlineNow(now: number, todayStart: number): Promise<{ accounts: number; activeToday: number }> {
  const db = createAdminClient();
  const [online, today] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", new Date(now - 3 * 60_000).toISOString()),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", new Date(todayStart).toISOString()),
  ]);
  if (online.error) throw new Error(online.error.message);
  return { accounts: online.count ?? 0, activeToday: today.count ?? 0 };
}

// --- Inscrits --------------------------------------------------------------

// Agrégé avant la mise en cache : quelques Ko par jour au lieu d'une ligne
// par compte (le cache de Next refuse les entrées de plus de 2 Mo).
export const signupsByDay = unstable_cache(
  async (sinceIso: string): Promise<SignupDay[]> => {
    const db = createAdminClient();
    const rows = await fetchAllRows<SignupRow>((from, to) =>
      db.from("profiles").select("created_at, utm_source, onboarding_completed").gte("created_at", sinceIso).order("created_at").range(from, to),
    );
    return aggregateSignups(rows);
  },
  ["admin-signups-by-day-v1"],
  { revalidate: 300 },
);

/** Comptes qui ont payé au moins une fois (abonnement ou accès à vie), d'après Stripe. */
export function payerIds(snap: StripeSnapshot): string[] {
  return [...paidSubs(snap).map((s) => s.userId), ...snap.oneTime.map((o) => o.userId)].filter((id): id is string => !!id);
}

/** Date d'inscription et source des payeurs (ids lus dans Stripe), pour les rattacher à leur source. */
export async function payerSignups(ids: string[]): Promise<{ day: string; source: string }[]> {
  const db = createAdminClient();
  const unique = [...new Set(ids)];
  const out: { day: string; source: string }[] = [];
  for (let i = 0; i < unique.length; i += 200) {
    const { data, error } = await db.from("profiles").select("created_at, utm_source").in("id", unique.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) out.push({ day: dayKey(Date.parse(p.created_at)), source: sourceKey(p.utm_source) });
  }
  return out;
}


/** Le flux des inscrits d'une période : comptes créés, onboarding fini, paywall vu, paiement ouvert. */
export type SignupFunnel = { signups: number; onboarded: number; paywallViewed: number; checkoutOpened: number };

// Événements lus par lots d'inscrits (index user_id + event_type), comme
// getLeoFunnel : un filtre sur event_type seul parcourrait toute la table.
export const signupFunnel = unstable_cache(
  async (sinceIso: string): Promise<SignupFunnel> => {
    const db = createAdminClient();
    const people = await fetchAllRows<{ id: string; onboarding_completed: boolean | null }>((from, to) =>
      db.from("profiles").select("id, onboarding_completed").gte("created_at", sinceIso).order("created_at").range(from, to),
    );
    const ids = people.map((p) => p.id);
    const viewed = new Set<string>();
    const opened = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await db
        .from("user_events")
        .select("user_id, event_type")
        .in("event_type", ["paywall_viewed", "checkout_opened"])
        .in("user_id", ids.slice(i, i + 200))
        .gte("created_at", sinceIso)
        .limit(20_000);
      if (error) throw new Error(error.message);
      for (const e of data ?? []) (e.event_type === "paywall_viewed" ? viewed : opened).add(e.user_id);
    }
    return { signups: ids.length, onboarded: people.filter((p) => p.onboarding_completed).length, paywallViewed: viewed.size, checkoutOpened: opened.size };
  },
  ["admin-signup-funnel-v1"],
  { revalidate: 600 },
);

// --- Pertinence du paquet (25/10) ------------------------------------------

export type DeckFeedback = { likes: number; passes: number; reasons: { reason: string; count: number }[] };

/** Likes, passes et raisons « Pas pour moi » depuis une date (en cache 10 min). */
export const deckFeedback = unstable_cache(
  async (sinceIso: string): Promise<DeckFeedback> => {
    const db = createAdminClient();
    const [likes, passes, reasons] = await Promise.all([
      db.from("swipes").select("id", { count: "exact", head: true }).eq("direction", "like").gte("created_at", sinceIso),
      db.from("swipes").select("id", { count: "exact", head: true }).eq("direction", "pass").gte("created_at", sinceIso),
      db.from("user_events").select("metadata").eq("event_type", "pass_reason").gte("created_at", sinceIso).limit(5000),
    ]);
    if (likes.error) throw new Error(likes.error.message);
    if (passes.error) throw new Error(passes.error.message);
    const counts = new Map<string, number>();
    for (const row of reasons.data ?? []) {
      const reason = (row.metadata as { reason?: unknown } | null)?.reason;
      if (typeof reason === "string") counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
    return {
      likes: likes.count ?? 0,
      passes: passes.count ?? 0,
      reasons: [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    };
  },
  ["admin-deck-feedback-v1"],
  { revalidate: 600 },
);
