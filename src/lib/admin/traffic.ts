import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { readVisits } from "@/lib/admin/dashboardStats";
import { paidSubs } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import {
  DAY_MS,
  VISITS_RELIABLE_SINCE,
  aggregateSignups,
  dayKey,
  sourceKey,
  type DaySource,
  type SignupDay,
  type SignupRow,
  type SourceVisitors,
} from "@/lib/admin/trafficStats";

// Trafic du site (24/10, demande de Nathan : « on ne voit pas combien de
// personnes sont venues aujourd'hui, combien sont en ligne, combien viennent
// des e-mails, ni d'où ils viennent, TikTok ou Instagram »).
//
// Visiteurs : table site_visits (un cookie anonyme par navigateur, une ligne
// par page ouverte, source = utm_source du lien, sinon site d'origine).
// Fiables depuis le 08/10 12 h 15 UTC (avant, chaque préchargement de lien
// comptait). Chaque visiteur est rangé sous la PREMIÈRE source connue de sa
// journée (ou de la période) : les pages suivantes, ouvertes depuis le site,
// n'ont pas de source et le compteraient sinon une 2e fois en « direct ».
// Comptés par la base (fonctions SQL du 24/10) ; tant qu'elles n'existent
// pas, seulement aujourd'hui et hier, lus ligne par ligne.
//
// Inscrits : profiles.created_at, source = utm_source posé à l'inscription
// (cookie de 30 jours : la source du premier lien, pas forcément du dernier).
// Calculs purs (sources, jours, rapprochements) : lib/admin/trafficStats.ts.

const FALLBACK_MAX_MS = 2 * DAY_MS + 3600_000;

// --- Visiteurs -------------------------------------------------------------

type Visit = { visitor_id: string; utm_source: string | null; path: string; created_at: string };

const missingFunction = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "PGRST202" || error.code === "42883" || /function .* does not exist|Could not find the function/i.test(error.message ?? ""));

// Repli sans les fonctions SQL : visites lues ligne par ligne, sur deux
// jours au plus (au-delà, trop lourd pour la base : voir dashboardStats).
async function readFallback(since: number, until: number): Promise<Visit[] | null> {
  if (until - since > FALLBACK_MAX_MS) return null;
  return readVisits<Visit>("visitor_id, utm_source, path, created_at", new Date(since), new Date(until), 3600_000);
}

function firstSource(visits: Visit[], keyOf: (v: Visit) => string): Map<string, { source: string; visit: Visit }> {
  const out = new Map<string, { source: string; visit: Visit }>();
  for (const v of [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const key = keyOf(v);
    const cur = out.get(key);
    const source = v.utm_source?.trim() || null;
    if (!cur) out.set(key, { source: source ?? "direct", visit: v });
    else if (cur.source === "direct" && source) out.set(key, { source, visit: cur.visit });
  }
  return out;
}

/** Visiteurs distincts par jour (Paris) et par source. null : historique indisponible sans le SQL. */
export const visitorsByDaySource = unstable_cache(
  async (sinceIso: string, untilIso: string): Promise<{ rows: DaySource[]; viaSql: boolean } | null> => {
    const since = Math.max(Date.parse(sinceIso), VISITS_RELIABLE_SINCE);
    const until = Date.parse(untilIso);
    if (until <= since) return { rows: [], viaSql: true };
    const { data, error } = await createAdminClient().rpc("admin_visitors_by_day_source", { p_since: new Date(since).toISOString(), p_until: untilIso });
    if (!error) return { rows: ((data ?? []) as { day: string; source: string; visitors: number }[]).map((r) => ({ ...r, visitors: Number(r.visitors) })), viaSql: true };
    if (!missingFunction(error)) throw new Error(error.message);
    const visits = await readFallback(since, until);
    if (!visits) return null;
    const counts = new Map<string, number>();
    for (const { source, visit } of firstSource(visits, (v) => `${v.visitor_id}|${dayKey(Date.parse(v.created_at))}`).values()) {
      const key = `${dayKey(Date.parse(visit.created_at))}|${source}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { rows: [...counts.entries()].map(([k, visitors]) => ({ day: k.split("|")[0], source: k.slice(11), visitors })), viaSql: false };
  },
  ["admin-traffic-day-source-v1"],
  { revalidate: 300 },
);

/** Visiteurs distincts de la période par source (chacun compté une fois), et combien ont vu la page d'inscription. */
export const visitorsBySource = unstable_cache(
  async (sinceIso: string, untilIso: string): Promise<{ rows: SourceVisitors[]; viaSql: boolean } | null> => {
    const since = Math.max(Date.parse(sinceIso), VISITS_RELIABLE_SINCE);
    const until = Date.parse(untilIso);
    if (until <= since) return { rows: [], viaSql: true };
    const { data, error } = await createAdminClient().rpc("admin_visitors_by_source", { p_since: new Date(since).toISOString(), p_until: untilIso });
    if (!error) {
      return {
        rows: ((data ?? []) as { source: string; visitors: number; signup_page_visitors: number }[]).map((r) => ({
          source: r.source,
          visitors: Number(r.visitors),
          signupPageVisitors: Number(r.signup_page_visitors),
        })),
        viaSql: true,
      };
    }
    if (!missingFunction(error)) throw new Error(error.message);
    const visits = await readFallback(since, until);
    if (!visits) return null;
    const signupVisitors = new Set(visits.filter((v) => v.path.startsWith("/inscription")).map((v) => v.visitor_id));
    const bySource = new Map<string, SourceVisitors>();
    for (const [visitorId, { source }] of firstSource(visits, (v) => v.visitor_id)) {
      const row = bySource.get(source) ?? { source, visitors: 0, signupPageVisitors: 0 };
      row.visitors++;
      if (signupVisitors.has(visitorId)) row.signupPageVisitors++;
      bySource.set(source, row);
    }
    return { rows: [...bySource.values()], viaSql: false };
  },
  ["admin-traffic-by-source-v1"],
  { revalidate: 300 },
);

/** Première page vue par chaque visiteur sur la période. null sans le SQL. */
export const landingPages = unstable_cache(
  async (sinceIso: string, untilIso: string): Promise<{ path: string; visitors: number }[] | null> => {
    const since = Math.max(Date.parse(sinceIso), VISITS_RELIABLE_SINCE);
    const { data, error } = await createAdminClient().rpc("admin_landing_pages", { p_since: new Date(since).toISOString(), p_until: untilIso, p_limit: 15 });
    if (!error) return ((data ?? []) as { path: string; visitors: number }[]).map((r) => ({ path: r.path, visitors: Number(r.visitors) }));
    if (missingFunction(error)) return null;
    throw new Error(error.message);
  },
  ["admin-traffic-landing-v1"],
  { revalidate: 600 },
);

/**
 * En ligne : visiteurs ayant ouvert une page dans les 5 dernières minutes
 * (comptes ou non), dont les comptes actifs dans les 3 dernières minutes
 * (même fenêtre que la page « En ligne »).
 */
export async function onlineNow(now: number): Promise<{ visitors: number; loggedIn: number }> {
  const db = createAdminClient();
  const [{ data: visits }, { count: loggedIn }] = await Promise.all([
    db.from("site_visits").select("visitor_id").gte("created_at", new Date(now - 5 * 60_000).toISOString()).limit(5000),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", new Date(now - 3 * 60_000).toISOString()),
  ]);
  return { visitors: new Set((visits ?? []).map((v) => v.visitor_id)).size, loggedIn: loggedIn ?? 0 };
}

/** Pages ouvertes et sources des 5 dernières minutes (visiteurs distincts). */
export async function liveVisits(now: number): Promise<{ visitors: number; pages: { path: string; visitors: number }[]; sources: { source: string; visitors: number }[] }> {
  const { data, error } = await createAdminClient()
    .from("site_visits")
    .select("visitor_id, path, utm_source, created_at")
    .gte("created_at", new Date(now - 5 * 60_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  // Page actuelle = la plus récente de chaque visiteur ; source = la première connue.
  const current = new Map<string, string>();
  for (const r of rows) if (!current.has(r.visitor_id)) current.set(r.visitor_id, r.path);
  const firsts = new Map<string, string>();
  for (const r of [...rows].reverse()) {
    const cur = firsts.get(r.visitor_id);
    if (!cur || (cur === "direct" && r.utm_source)) firsts.set(r.visitor_id, r.utm_source?.trim() || "direct");
  }
  const count = (values: Iterable<string>) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  return {
    visitors: current.size,
    pages: count(current.values()).slice(0, 10).map(([path, visitors]) => ({ path, visitors })),
    sources: count(firsts.values()).map(([source, visitors]) => ({ source, visitors })),
  };
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


