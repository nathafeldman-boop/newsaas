import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupsIn } from "@/lib/admin/cockpit/db";
import { startOfParisDay } from "@/lib/admin/cockpit/format";
import { churnIn, currentState, DAY_MS, firstPaidBySub, paidSubs, revenueIn, type Range } from "@/lib/admin/cockpit/metrics";
import { getStripeSnapshot } from "@/lib/admin/cockpit/stripeSnapshot";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import { getHeardFromStats, getRpmWindowStats } from "@/lib/admin/dashboardStats";
import { signupFunnel, signupsByDay } from "@/lib/admin/traffic";
import { dayKey } from "@/lib/admin/trafficStats";
import { byChannel, type ChannelRow, type Rates } from "@/lib/admin/goals";

// Lectures des objectifs et du simulateur (voir lib/admin/goals.ts pour les
// calculs). Taux mesurés sur les 30 derniers jours : Stripe pour l'argent,
// profils pour les inscrits, réponses « Tu nous as connus comment ? » pour
// les canaux, vues saisies dans RPM pour les vues.

export const RATES_WINDOW_DAYS = 30;

export type MeasuredRates = Rates & {
  windowDays: number;
  signups: number;
  /** Inscrits de la fenêtre qui ont payé (abonnement ou accès à vie). */
  payers: number;
  firstPayments: number;
  firstPaymentCents: number;
  /** Part des premiers paiements qui sont des abonnements (le reste : accès à vie). */
  monthlyShare: number | null;
  monthlyPriceCents: number | null;
  /** 1 − part des abonnés partis sur 30 jours. */
  retention: number | null;
  /** MRR à jour hors résiliations programmées : la base récurrente actuelle. */
  baseMrrCents: number;
  views: { date: string; views: number; signups: number } | null;
  channels: ChannelRow[];
  channelsAnswered: number;
  channelsError: boolean;
};

/** Montant du premier paiement de chaque abonnement payé. */
function firstAmountBySub(snap: StripeSnapshot): Map<string, { at: number; cents: number }> {
  const out = new Map<string, { at: number; cents: number }>();
  for (const inv of snap.invoices) {
    if (!inv.subscription || inv.status !== "paid" || inv.amountPaid <= 0) continue;
    const at = inv.paidAt ?? inv.created;
    const prev = out.get(inv.subscription);
    if (!prev || at < prev.at) out.set(inv.subscription, { at, cents: inv.amountPaid });
  }
  return out;
}

/** Inscrits pour 1 000 vues, d'après la dernière saisie de vues (page RPM). */
async function viewsRate(): Promise<MeasuredRates["views"]> {
  const db = createAdminClient();
  const { data: latest, error } = await db.from("content_views").select("recorded_on").order("recorded_on", { ascending: false }).limit(1);
  if (error || !latest?.[0]) return null;
  const date = latest[0].recorded_on as string;
  const { data: rows } = await db.from("content_views").select("source, views").eq("recorded_on", date);
  const stats = await getRpmWindowStats(new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString());
  let views = 0;
  let signups = 0;
  for (const r of rows ?? []) {
    if (r.views <= 0) continue;
    views += r.views;
    signups += stats[r.source]?.signups ?? 0;
  }
  return views > 0 ? { date, views, signups } : null;
}

async function computeRates(): Promise<MeasuredRates> {
  const snap = await getStripeSnapshot();
  // Arrondi à l'heure : les lectures en cache gardent la même clé.
  const now = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  const window: Range = { start: now - RATES_WINDOW_DAYS * DAY_MS, end: now };
  const inWindow = (t: number) => t >= window.start && t < window.end;

  const firstPaid = firstPaidBySub(snap.invoices);
  const paid = paidSubs(snap, firstPaid);
  const firsts = firstAmountBySub(snap);
  const newSubs = paid.filter((s) => {
    const f = firsts.get(s.id);
    return !!f && inWindow(f.at);
  });
  const newLifetime = snap.oneTime.filter((o) => inWindow(o.created));
  const firstPayments = newSubs.length + newLifetime.length;
  const firstPaymentCents = newSubs.reduce((a, s) => a + (firsts.get(s.id)?.cents ?? 0), 0) + newLifetime.reduce((a, o) => a + o.amountCents, 0);
  const recurring = newSubs.filter((s) => s.currency === "eur");

  const payerIds = new Set([...paid.map((s) => s.userId), ...snap.oneTime.map((o) => o.userId)].filter((id): id is string => !!id));
  const [signupIds, funnel, heard, views] = await Promise.all([
    signupsIn(window),
    signupFunnel(new Date(window.start).toISOString()).catch(() => null),
    getHeardFromStats().catch(() => null),
    viewsRate().catch(() => null),
  ]);
  const payers = signupIds.filter((id) => payerIds.has(id)).length;
  const churn = churnIn(paid, window);
  const state = currentState(paid, now);

  return {
    windowDays: RATES_WINDOW_DAYS,
    signups: signupIds.length,
    payers,
    conversion: signupIds.length > 0 && payers > 0 ? payers / signupIds.length : null,
    avgFirstPaymentCents: firstPayments > 0 ? Math.round(firstPaymentCents / firstPayments) : null,
    paywallRate: funnel && funnel.signups > 0 ? funnel.paywallViewed / funnel.signups : null,
    checkoutRate: funnel && funnel.signups > 0 ? funnel.checkoutOpened / funnel.signups : null,
    signupsPer1000Views: views && views.signups > 0 ? (views.signups / views.views) * 1000 : null,
    firstPayments,
    firstPaymentCents,
    monthlyShare: firstPayments > 0 ? newSubs.length / firstPayments : null,
    monthlyPriceCents: recurring.length > 0 ? Math.round(recurring.reduce((a, s) => a + s.mrrCents, 0) / recurring.length) : null,
    retention: churn.rate === null ? null : 1 - churn.rate,
    baseMrrCents: state.mrr - state.scheduled.mrr,
    views,
    channels: heard ? byChannel(heard.rows) : [],
    channelsAnswered: heard?.answered ?? 0,
    channelsError: heard === null,
  };
}

/** Taux mesurés (en cache 15 min : une dizaine de lectures, dont tous les inscrits du mois). */
export const getMeasuredRates = unstable_cache(computeRates, ["admin-goals-rates-v1"], { revalidate: 900 });

export type GoalDay = { t: number; key: string; cents: number; signups: number; newPayers: number };

/** Jours du mois, de minuit à minuit à Paris (25 h le jour du passage à l'heure d'hiver). */
export function parisDays(range: Range): Range[] {
  const out: Range[] = [];
  for (let t = range.start; t < range.end; ) {
    const next = Math.min(startOfParisDay(t + DAY_MS + 3 * 3_600_000), range.end);
    out.push({ start: t, end: next });
    t = next;
  }
  return out;
}

/** Le mois jour par jour (heure de Paris) : encaissé net, inscrits, nouveaux payants. */
export async function monthDays(snap: StripeSnapshot, range: Range, now: number): Promise<GoalDay[]> {
  const days = parisDays(range);
  const signups = range.start <= now ? await signupsByDay(new Date(range.start).toISOString()).catch(() => []) : [];
  const signupsByKey = new Map(signups.map((d) => [d.day, d.signups]));
  const firsts = firstAmountBySub(snap);
  const newPayers = new Map<string, Set<string>>();
  const note = (t: number, who: string) => {
    if (t < range.start || t >= range.end) return;
    const key = dayKey(t);
    const set = newPayers.get(key) ?? new Set<string>();
    set.add(who);
    newPayers.set(key, set);
  };
  for (const s of snap.subs) {
    const f = firsts.get(s.id);
    if (f) note(f.at, s.userId ?? s.customer);
  }
  for (const o of snap.oneTime) note(o.created, o.userId);
  return days.map((d) => {
    const key = dayKey(d.start);
    const rev = revenueIn(snap, d);
    return { t: d.start, key, cents: rev.netCents, signups: signupsByKey.get(key) ?? 0, newPayers: newPayers.get(key)?.size ?? 0 };
  });
}

// --- Objectifs enregistrés (table revenue_goals) ----------------------------

export const GOALS_TABLE_SQL = `create table if not exists public.revenue_goals (
  month text primary key check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  target_cents integer not null check (target_cents >= 0),
  updated_at timestamptz not null default now()
);
alter table public.revenue_goals enable row level security;`;

export async function loadSavedGoals(): Promise<{ goals: Record<string, number>; missingTable: boolean }> {
  const { data, error } = await createAdminClient().from("revenue_goals").select("month, target_cents").order("month");
  if (error) {
    const missingTable = error.code === "42P01" || error.code === "PGRST205";
    if (!missingTable) console.error("objectifs: lecture des objectifs en échec", error);
    return { goals: {}, missingTable };
  }
  return { goals: Object.fromEntries((data ?? []).map((g) => [g.month as string, g.target_cents as number])), missingTable: false };
}
