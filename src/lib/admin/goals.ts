import { DAY_MS, renewalSummary, renewalsIn, type Range } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

// Objectifs de chiffre d'affaires et simulateur (26/10, demande de Nathan :
// « octobre 1 300 €, novembre 3 000 €, décembre 5 000 € ; combien
// d'utilisateurs il nous faudrait, avec le taux de conversion, les vues… ;
// et un simulateur : si je ramène 6 000 personnes de TikTok, combien
// d'argent ? »). Fonctions pures, testables ; lectures dans
// lib/admin/goalsData.ts. Montants en centimes, dates en millisecondes.
// Rien n'est inventé : chaque estimation part d'un taux mesuré (Stripe,
// inscrits) et le dit ; un taux non mesurable reste vide (null).

/** Objectifs fixés par Nathan le 26/10 ; ceux enregistrés dans l'admin (table revenue_goals) les remplacent. */
export const DEFAULT_GOALS: Record<string, number> = {
  "2026-10": 130_000,
  "2026-11": 300_000,
  "2026-12": 500_000,
};

export function goalFor(month: string, saved: Record<string, number>): number | null {
  return saved[month] ?? DEFAULT_GOALS[month] ?? null;
}

/** « 2026-11 » → « novembre 2026 ». */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 15));
  return d.toISOString().slice(0, 7);
}

// --- Avancement du mois ----------------------------------------------------

export type DayRevenue = { t: number; cents: number };

export type MonthProgress = {
  totalCents: number;
  /** Cumul jour après jour (jours commencés seulement). */
  cumulative: number[];
  /** Rythme régulier vers l'objectif : objectif × jours écoulés / jours du mois. */
  pace: number[];
  daysInMonth: number;
  /** Jours commencés (aujourd'hui compris). */
  daysElapsed: number;
  /** Jours à venir, aujourd'hui compris s'il n'est pas fini. */
  daysToGo: number;
  /** Part de l'objectif atteinte, et celle attendue à ce jour au rythme régulier. */
  doneRatio: number;
  expectedRatio: number;
  /** Moyenne des 7 derniers jours terminés. */
  avgLast7: number;
  /** Fin de mois si les jours à venir ressemblent aux 7 derniers jours terminés. */
  projectionCents: number;
  /** Ce qu'il faut encaisser chaque jour à venir (aujourd'hui compris) pour atteindre l'objectif. */
  neededPerDay: number;
  best: DayRevenue | null;
};

/**
 * days : un point par jour du mois (heure de Paris), dans l'ordre ;
 * todayInProgress : le dernier jour commencé est aujourd'hui (pas fini).
 */
export function monthProgress(days: DayRevenue[], goalCents: number, now: number, todayInProgress: boolean): MonthProgress {
  const elapsed = days.filter((d) => d.t <= now);
  let run = 0;
  const cumulative = elapsed.map((d) => (run += d.cents));
  const totalCents = run;
  const daysInMonth = days.length;
  const daysElapsed = elapsed.length;
  const today = todayInProgress ? elapsed[elapsed.length - 1] ?? null : null;
  const complete = today ? elapsed.slice(0, -1) : elapsed;
  const futureDays = daysInMonth - daysElapsed;
  const daysToGo = futureDays + (today ? 1 : 0);
  const last7 = complete.slice(-7);
  const avgLast7 = last7.length > 0 ? Math.round(last7.reduce((a, d) => a + d.cents, 0) / last7.length) : 0;
  const remaining = Math.max(0, goalCents - totalCents);
  // Aujourd'hui : ce qui est déjà encaissé, ou la moyenne si la journée finit comme d'habitude.
  const projectionCents = totalCents - (today?.cents ?? 0) + (today ? Math.max(today.cents, avgLast7) : 0) + avgLast7 * futureDays;
  return {
    totalCents,
    cumulative,
    pace: elapsed.map((_, i) => Math.round((goalCents * (i + 1)) / Math.max(1, daysInMonth))),
    daysInMonth,
    daysElapsed,
    daysToGo,
    doneRatio: goalCents > 0 ? totalCents / goalCents : 0,
    expectedRatio: daysInMonth > 0 ? daysElapsed / daysInMonth : 0,
    avgLast7,
    projectionCents,
    neededPerDay: daysToGo > 0 ? Math.ceil(remaining / daysToGo) : remaining,
    best: elapsed.reduce<DayRevenue | null>((b, d) => (d.cents > 0 && (!b || d.cents > b.cents) ? d : b), null),
  };
}

// --- Renouvellements attendus ---------------------------------------------

/**
 * Renouvellements des abonnés actuels attendus dans `r` (après `now`) :
 * chaque échéance à venir pondérée par la probabilité qu'elle passe, d'après
 * les taux mesurés sur les 60 derniers jours (1er renouvellement à part,
 * plus fragile). Une résiliation programmée n'est jamais comptée. Les
 * abonnés gagnés d'ici là ne sont pas comptés (estimation prudente).
 */
export function expectedRenewals(snap: StripeSnapshot, r: Range, now: number): { cents: number; count: number; firstRate: number | null; laterRate: number | null } {
  const past = renewalSummary(renewalsIn(snap, { start: now - 60 * DAY_MS, end: now }, now));
  const firstRate = past.first.rate;
  const laterRate = past.later.rate ?? past.all.rate;
  const upcoming = renewalsIn(snap, { start: now, end: r.end }, now).filter((x) => x.outcome === "à venir" && x.sub.currency === "eur");
  const chance = new Map<string, number>();
  let cents = 0;
  let count = 0;
  for (const row of upcoming) {
    const rate = (row.k === 1 ? firstRate : laterRate) ?? 1;
    const p = (chance.get(row.sub.id) ?? 1) * rate;
    chance.set(row.sub.id, p);
    if (row.due < r.start) continue;
    cents += row.sub.amountCents * p;
    count += p;
  }
  return { cents: Math.round(cents), count, firstRate, laterRate };
}

// --- Ce qu'il faut pour atteindre un objectif ------------------------------

export type Rates = {
  /** Payants / inscrits (fenêtre de mesure). */
  conversion: number | null;
  /** Premier paiement moyen (abonnement ou accès à vie). */
  avgFirstPaymentCents: number | null;
  /** Inscrits qui voient le paywall, puis qui ouvrent le paiement. */
  paywallRate: number | null;
  checkoutRate: number | null;
  /** Inscrits pour 1 000 vues (saisies dans RPM) ; null si aucune saisie. */
  signupsPer1000Views: number | null;
};

export type Plan = {
  newRevenueCents: number;
  payers: number | null;
  signups: number | null;
  paywallViews: number | null;
  checkouts: number | null;
  views: number | null;
};

/** Pour encaisser `targetCents` en plus de `baseCents` déjà attendus : nouveaux payants, inscrits, vues… */
export function planFor(targetCents: number, baseCents: number, rates: Rates): Plan {
  const newRevenueCents = Math.max(0, targetCents - baseCents);
  const payers = rates.avgFirstPaymentCents ? Math.ceil(newRevenueCents / rates.avgFirstPaymentCents) : null;
  const signups = payers !== null && rates.conversion ? Math.ceil(payers / rates.conversion) : null;
  return {
    newRevenueCents,
    payers,
    signups,
    paywallViews: signups !== null && rates.paywallRate !== null ? Math.ceil(signups * rates.paywallRate) : null,
    checkouts: signups !== null && rates.checkoutRate !== null ? Math.ceil(signups * rates.checkoutRate) : null,
    views: signups !== null && rates.signupsPer1000Views ? Math.ceil((signups / rates.signupsPer1000Views) * 1000) : null,
  };
}

// --- Simulateur : N inscrits → revenu ---------------------------------------

export type SimInput = {
  signups: number;
  conversion: number;
  avgFirstPaymentCents: number;
  /** Part des nouveaux payants qui prennent un abonnement mensuel (le reste : paiement unique). */
  monthlyShare: number;
  /** Prix mensuel moyen des abonnés. */
  monthlyPriceCents: number;
  /** Part des abonnés qui renouvellent chaque mois. */
  retention: number;
  months: number;
};

export type SimResult = { payers: number; monthlyPayers: number; byMonth: number[]; totalCents: number };

export function simulate(input: SimInput): SimResult {
  const payers = input.signups * input.conversion;
  const monthlyPayers = payers * input.monthlyShare;
  const byMonth: number[] = [];
  for (let m = 0; m < Math.max(1, input.months); m++) {
    byMonth.push(m === 0 ? payers * input.avgFirstPaymentCents : monthlyPayers * input.monthlyPriceCents * Math.pow(input.retention, m));
  }
  return { payers, monthlyPayers, byMonth: byMonth.map(Math.round), totalCents: Math.round(byMonth.reduce((a, b) => a + b, 0)) };
}

// --- Canaux (« Tu nous as connus comment ? ») -------------------------------

export type ChannelRow = { channel: string; signups: number; payers: number; cents: number };

/** Regroupe « TikTok · commentaire », « TikTok · vidéo »… sous « TikTok ». */
export function byChannel(rows: { source: string; answers: number; payers: number; cents: number }[]): ChannelRow[] {
  const out = new Map<string, ChannelRow>();
  for (const r of rows) {
    const channel = r.source.split(" · ")[0];
    const c = out.get(channel) ?? { channel, signups: 0, payers: 0, cents: 0 };
    c.signups += r.answers;
    c.payers += r.payers;
    c.cents += r.cents;
    out.set(channel, c);
  }
  return [...out.values()].sort((a, b) => b.signups - a.signups);
}

/** Sous ce nombre d'inscrits, le taux d'un canal est trop fragile : le taux global est utilisé et signalé. */
export const MIN_CHANNEL_SIGNUPS = 30;
