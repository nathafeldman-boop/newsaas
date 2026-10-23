import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/public";
import {
  NEWS_CAMPAIGN_EVENT,
  NEWS_TEST_START,
  NEWS_VARIANTS,
  isNewsVariant,
  newsUtmCampaign,
  type NewsVariant,
} from "@/lib/campaigns/relanceOffres";
import type { Database } from "@/types/database";

// Test des 4 versions de la relance « nouveautés » (26/10 → 1/11, Nathan :
// « tu vois la template qui marche le mieux et tu la gardes »).
// - Jour 1 : les versions à parts égales.
// - Dès que chacune a MIN_SENT_PER_VARIANT envois et après un jour de recul,
//   la meilleure prend 80 % des envois ; les autres se partagent le reste,
//   pour que le classement puisse encore changer si l'écart était du hasard.
// « Meilleure » = personnes arrivées sur Stageio par un lien de l'email
// (visiteurs distincts, utm_campaign de la version), rapportées aux envois.
// Les envois récents n'ont pas encore eu le temps de cliquer : ça pénalise
// un peu la version en tête (elle a le plus d'envois récents), jamais
// l'inverse, donc pas d'emballement.

type Db = SupabaseClient<Database>;

export const MIN_SENT_PER_VARIANT = 100;
export const WINNER_SHARE = 0.8;
const LEARNING_MS = 24 * 3_600_000;

export type VariantCount = { variant: NewsVariant; sent: number; clickers: number; rate: number };

const isoStart = new Date(NEWS_TEST_START).toISOString();

async function loadTestEvents(db: Db) {
  const events = await fetchAllRows<{ user_id: string; metadata: Record<string, unknown> | null; created_at: string }>(
    (from, to) =>
      db
        .from("user_events")
        .select("user_id, metadata, created_at")
        .eq("event_type", NEWS_CAMPAIGN_EVENT)
        .gte("created_at", isoStart)
        .order("created_at")
        .range(from, to),
  );
  return events.flatMap((e) => {
    const variant = e.metadata?.variant;
    return isNewsVariant(variant) ? [{ userId: e.user_id, variant, createdAt: e.created_at }] : [];
  });
}

async function loadClickers(db: Db): Promise<Map<NewsVariant, Set<string>>> {
  const campaigns = new Map(NEWS_VARIANTS.map((v) => [newsUtmCampaign(v), v]));
  const visits = await fetchAllRows<{ visitor_id: string; utm_campaign: string | null }>((from, to) =>
    db
      .from("site_visits")
      .select("visitor_id, utm_campaign")
      .gte("created_at", isoStart)
      .in("utm_campaign", [...campaigns.keys()])
      .order("created_at")
      .range(from, to),
  );
  const byVariant = new Map<NewsVariant, Set<string>>(NEWS_VARIANTS.map((v) => [v, new Set()]));
  for (const visit of visits) {
    const variant = visit.utm_campaign ? campaigns.get(visit.utm_campaign) : undefined;
    if (variant) byVariant.get(variant)!.add(visit.visitor_id);
  }
  return byVariant;
}

function toCounts(events: { variant: NewsVariant }[], clickers: Map<NewsVariant, Set<string>>): VariantCount[] {
  return NEWS_VARIANTS.map((variant) => {
    const sent = events.filter((e) => e.variant === variant).length;
    const clicked = clickers.get(variant)?.size ?? 0;
    return { variant, sent, clickers: clicked, rate: sent > 0 ? clicked / sent : 0 };
  });
}

export async function loadVariantCounts(db: Db): Promise<VariantCount[]> {
  const [events, clickers] = await Promise.all([loadTestEvents(db), loadClickers(db)]);
  return toCounts(events, clickers);
}

export function leaderOf(counts: VariantCount[], now: number = Date.now()): NewsVariant | null {
  if (now - NEWS_TEST_START < LEARNING_MS) return null;
  if (counts.some((c) => c.sent < MIN_SENT_PER_VARIANT)) return null;
  return [...counts].sort((a, b) => b.rate - a.rate || b.sent - a.sent)[0].variant;
}

// Version de chaque email du lot, dans l'ordre du lot.
export function allocateVariants(
  counts: VariantCount[],
  n: number,
  now: number = Date.now(),
  random: () => number = Math.random,
): NewsVariant[] {
  const sent = new Map(counts.map((c) => [c.variant, c.sent]));
  const leader = leaderOf(counts, now);
  const others = NEWS_VARIANTS.filter((v) => v !== leader);
  const out: NewsVariant[] = [];
  for (let i = 0; i < n; i++) {
    // Hors version en tête : la moins envoyée, pour garder des parts égales.
    const variant =
      leader && random() < WINNER_SHARE ? leader : others.reduce((min, v) => ((sent.get(v) ?? 0) < (sent.get(min) ?? 0) ? v : min));
    sent.set(variant, (sent.get(variant) ?? 0) + 1);
    out.push(variant);
  }
  return out;
}

export type VariantReport = VariantCount & { cameBack: number; payers: number; payersCents: number };

// Pour /admin/relance : en plus des clics, les destinataires revenus sur
// Stageio (connectés) après leur email, et ceux qui ont payé après.
export async function loadVariantReport(db: Db): Promise<{ rows: VariantReport[]; leader: NewsVariant | null }> {
  const [events, clickers] = await Promise.all([loadTestEvents(db), loadClickers(db)]);
  const counts = toCounts(events, clickers);
  const sentAt = new Map(events.map((e) => [e.userId, e]));
  const extra = new Map(NEWS_VARIANTS.map((v) => [v, { cameBack: 0, payers: 0, payersCents: 0 }]));
  const ids = [...sentAt.keys()];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db
      .from("profiles")
      .select("id, last_active_at, premium_activated_at, total_paid_cents")
      .in("id", ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) {
      const sent = sentAt.get(p.id);
      if (!sent) continue;
      const row = extra.get(sent.variant)!;
      if (p.last_active_at && p.last_active_at > sent.createdAt) row.cameBack++;
      if (p.premium_activated_at && p.premium_activated_at > sent.createdAt && (p.total_paid_cents ?? 0) > 0) {
        row.payers++;
        row.payersCents += p.total_paid_cents ?? 0;
      }
    }
  }
  return {
    rows: counts.map((c) => ({ ...c, ...extra.get(c.variant)! })),
    leader: leaderOf(counts),
  };
}
