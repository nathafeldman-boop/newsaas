import type { InvoiceRecord, StripeSnapshot, SubRecord } from "@/lib/admin/cockpit/types";

// Calculs du cockpit sur l'instantané Stripe (fonctions pures, testables).
// Conventions, aussi affichées sur la page « Définitions » :
// - Un abonnement compte comme client à partir de sa première facture payée
//   (> 0 €) ; jamais payé (carte refusée à la création) : jamais client.
// - Il reste client jusqu'à sa fin réelle (ended_at). Une résiliation
//   programmée garde le client jusqu'à l'échéance payée.
// - MRR : montant récurrent ramené au mois (52 semaines, 365 jours par an),
//   euros seulement. Le MRR du jour exclut les impayés (past_due, unpaid)
//   et les pauses, affichés à part. La série historique ne peut pas savoir
//   si un abonnement était en impayé à une date passée : elle compte tout
//   abonnement en cours.
// - Période = [début, fin[ en millisecondes.

export const DAY_MS = 86_400_000;
export type Range = { start: number; end: number };

export function firstPaidBySub(invoices: InvoiceRecord[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.subscription || inv.status !== "paid" || inv.amountPaid <= 0) continue;
    const at = inv.paidAt ?? inv.created;
    const prev = out.get(inv.subscription);
    if (prev === undefined || at < prev) out.set(inv.subscription, at);
  }
  return out;
}

export function paidSubs(snap: StripeSnapshot, firstPaid = firstPaidBySub(snap.invoices)): SubRecord[] {
  return snap.subs.filter((s) => firstPaid.has(s.id));
}

export function activeAt(sub: SubRecord, t: number): boolean {
  return t >= sub.startDate && (sub.endedAt === null || t < sub.endedAt);
}

const inRange = (t: number | null, r: Range) => t !== null && t >= r.start && t < r.end;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const eur = (s: SubRecord) => s.currency === "eur";

/** MRR (centimes) des abonnements en cours à l'instant t, impayés compris. */
export function mrrAt(subs: SubRecord[], t: number): number {
  return sum(subs.filter((s) => eur(s) && activeAt(s, t)).map((s) => s.mrrCents));
}

export function mrrSeries(subs: SubRecord[], r: Range, stepMs = DAY_MS): { t: number; mrr: number; active: number }[] {
  const out: { t: number; mrr: number; active: number }[] = [];
  for (let t = r.start; t < r.end; t += stepMs) {
    const point = Math.min(t + stepMs - 1, r.end - 1);
    const live = subs.filter((s) => activeAt(s, point));
    out.push({ t, mrr: sum(live.filter(eur).map((s) => s.mrrCents)), active: live.length });
  }
  return out;
}

const PAST_DUE = new Set(["past_due", "unpaid"]);

export type CurrentState = {
  active: number;
  mrr: number;
  scheduled: { count: number; mrr: number };
  pastDue: { count: number; mrr: number };
  paused: { count: number; mrr: number };
  byPlan: { label: string; count: number; mrr: number }[];
};

export function planLabel(s: Pick<SubRecord, "amountCents" | "interval" | "intervalCount">): string {
  const price = (s.amountCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const unit = { day: "jour", week: "semaine", month: "mois", year: "an" }[s.interval];
  return s.intervalCount > 1 ? `${price} € / ${s.intervalCount} ${unit}s` : `${price} € / ${unit}`;
}

export function currentState(subs: SubRecord[], now: number): CurrentState {
  const live = subs.filter((s) => activeAt(s, now));
  const pastDue = live.filter((s) => PAST_DUE.has(s.status));
  const paused = live.filter((s) => s.paused && !PAST_DUE.has(s.status));
  const healthy = live.filter((s) => !PAST_DUE.has(s.status) && !s.paused);
  const scheduled = healthy.filter((s) => s.cancelAt !== null || s.cancelAtPeriodEnd);
  const plans = new Map<string, { label: string; count: number; mrr: number }>();
  for (const s of healthy) {
    const label = planLabel(s);
    const p = plans.get(label) ?? { label, count: 0, mrr: 0 };
    p.count++;
    if (eur(s)) p.mrr += s.mrrCents;
    plans.set(label, p);
  }
  const mrrOf = (xs: SubRecord[]) => sum(xs.filter(eur).map((s) => s.mrrCents));
  return {
    active: healthy.length,
    mrr: mrrOf(healthy),
    scheduled: { count: scheduled.length, mrr: mrrOf(scheduled) },
    pastDue: { count: pastDue.length, mrr: mrrOf(pastDue) },
    paused: { count: paused.length, mrr: mrrOf(paused) },
    byPlan: [...plans.values()].sort((a, b) => b.count - a.count),
  };
}

export type Revenue = {
  recurringCents: number;
  oneTimeCents: number;
  refundedCents: number;
  refunds: number;
  disputes: number;
  disputedCents: number;
  /** Encaissé − remboursé (frais Stripe non déduits). */
  netCents: number;
};

export function revenueIn(snap: StripeSnapshot, r: Range): Revenue {
  // Achats à vie : montant de la session (leur facture n'est pas rattachée
  // à un abonnement et n'est donc pas comptée deux fois).
  const recurringCents = sum(
    snap.invoices.filter((i) => i.subscription && i.status === "paid" && inRange(i.paidAt ?? i.created, r)).map((i) => i.amountPaid),
  );
  const oneTimeCents = sum(snap.oneTime.filter((o) => inRange(o.created, r)).map((o) => o.amountCents));
  const refunds = snap.refunds.filter((x) => inRange(x.created, r));
  const disputes = snap.disputes.filter((x) => inRange(x.created, r));
  const refundedCents = sum(refunds.map((x) => x.amount));
  return {
    recurringCents,
    oneTimeCents,
    refundedCents,
    refunds: refunds.length,
    disputes: disputes.length,
    disputedCents: sum(disputes.map((x) => x.amount)),
    netCents: recurringCents + oneTimeCents - refundedCents,
  };
}

export type DailyRevenue = { t: number; recurring: number; oneTime: number; refunds: number };

export function dailyRevenue(snap: StripeSnapshot, r: Range): DailyRevenue[] {
  const days: DailyRevenue[] = [];
  for (let t = r.start; t < r.end; t += DAY_MS) {
    const rev = revenueIn(snap, { start: t, end: Math.min(t + DAY_MS, r.end) });
    days.push({ t, recurring: rev.recurringCents, oneTime: rev.oneTimeCents, refunds: rev.refundedCents });
  }
  return days;
}

export type Movement = {
  newSubs: number;
  newMrr: number;
  lifetimeBuyers: number;
  renewals: number;
  renewalCents: number;
  failedOpen: number;
  recoveredAfterFailure: number;
  cancelRequests: number;
};

export function movementIn(snap: StripeSnapshot, r: Range, firstPaid = firstPaidBySub(snap.invoices)): Movement {
  const newSubs = snap.subs.filter((s) => inRange(firstPaid.get(s.id) ?? null, r));
  const cycle = snap.invoices.filter((i) => i.subscription && i.billingReason === "subscription_cycle");
  const renewals = cycle.filter((i) => i.status === "paid" && i.amountPaid > 0 && inRange(i.paidAt ?? i.created, r));
  const subInvoices = snap.invoices.filter((i) => i.subscription);
  return {
    newSubs: newSubs.length,
    newMrr: sum(newSubs.filter(eur).map((s) => s.mrrCents)),
    lifetimeBuyers: new Set(snap.oneTime.filter((o) => inRange(o.created, r)).map((o) => o.userId)).size,
    renewals: renewals.length,
    renewalCents: sum(renewals.map((i) => i.amountPaid)),
    failedOpen: subInvoices.filter((i) => i.attemptCount > 0 && (i.status === "open" || i.status === "uncollectible") && inRange(i.created, r)).length,
    recoveredAfterFailure: subInvoices.filter((i) => i.status === "paid" && i.attemptCount > 1 && inRange(i.paidAt ?? i.created, r)).length,
    cancelRequests: snap.subs.filter((s) => firstPaid.has(s.id) && inRange(s.canceledAt, r)).length,
  };
}

export type Churn = {
  /** Clients en cours au début de la période. */
  startCount: number;
  startMrr: number;
  /** Parmi eux, abonnements terminés pendant la période. */
  churned: number;
  churnedMrr: number;
  voluntary: number;
  involuntary: number;
  unknown: number;
  /** null quand il n'y avait aucun client au début (incalculable). */
  rate: number | null;
  revenueRate: number | null;
  /** Abonnés pendant la période et déjà terminés avant sa fin. */
  startedAndEnded: number;
};

export function churnIn(subs: SubRecord[], r: Range): Churn {
  const atStart = subs.filter((s) => activeAt(s, r.start));
  const churned = atStart.filter((s) => inRange(s.endedAt, r));
  const startMrr = sum(atStart.filter(eur).map((s) => s.mrrCents));
  const churnedMrr = sum(churned.filter(eur).map((s) => s.mrrCents));
  return {
    startCount: atStart.length,
    startMrr,
    churned: churned.length,
    churnedMrr,
    voluntary: churned.filter((s) => s.cancelReason === "cancellation_requested").length,
    involuntary: churned.filter((s) => s.cancelReason === "payment_failed" || s.cancelReason === "payment_disputed").length,
    unknown: churned.filter((s) => !s.cancelReason).length,
    rate: atStart.length > 0 ? churned.length / atStart.length : null,
    revenueRate: startMrr > 0 ? churnedMrr / startMrr : null,
    startedAndEnded: subs.filter((s) => inRange(s.startDate, r) && inRange(s.endedAt, r)).length,
  };
}

/** Échéance n°k (k ≥ 1) : même jour du mois que l'ancre, ramené au dernier jour si le mois est plus court (règle Stripe). */
export function dueDate(sub: Pick<SubRecord, "anchor" | "interval" | "intervalCount">, k: number): number {
  const n = k * Math.max(1, sub.intervalCount);
  if (sub.interval === "day") return sub.anchor + n * DAY_MS;
  if (sub.interval === "week") return sub.anchor + n * 7 * DAY_MS;
  const a = new Date(sub.anchor);
  const months = sub.interval === "year" ? n * 12 : n;
  const y = a.getUTCFullYear();
  const m = a.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(a.getUTCDate(), lastDay), a.getUTCHours(), a.getUTCMinutes(), a.getUTCSeconds());
}

export type RenewalOutcome = "réussi" | "échoué" | "annulé avant l'échéance" | "à venir" | "inconnu";

export type RenewalRow = {
  sub: SubRecord;
  k: number;
  due: number;
  outcome: RenewalOutcome;
  invoice: InvoiceRecord | null;
};

const RENEWAL_WINDOW_MS = 3 * DAY_MS;

export function renewalsIn(snap: StripeSnapshot, r: Range, now: number, firstPaid = firstPaidBySub(snap.invoices)): RenewalRow[] {
  const cycleBySub = new Map<string, InvoiceRecord[]>();
  for (const inv of snap.invoices) {
    if (!inv.subscription || inv.billingReason !== "subscription_cycle") continue;
    const list = cycleBySub.get(inv.subscription) ?? [];
    list.push(inv);
    cycleBySub.set(inv.subscription, list);
  }
  const rows: RenewalRow[] = [];
  for (const sub of snap.subs) {
    if (!firstPaid.has(sub.id)) continue;
    // Fin réelle ou programmée. La première échéance qui tombe après est
    // le renouvellement qui n'aura pas lieu ; il n'y en a pas d'autre. Fin
    // pour impayé : l'échec est déjà compté à sa propre échéance.
    const scheduledEnd = sub.cancelAt ?? (sub.cancelAtPeriodEnd ? sub.currentPeriodEnd : null);
    const endTime = Math.min(sub.endedAt ?? Infinity, scheduledEnd ?? Infinity);
    const involuntary = sub.cancelReason === "payment_failed" || sub.cancelReason === "payment_disputed";
    for (let k = 1; k < 1000; k++) {
      const due = dueDate(sub, k);
      if (due >= r.end) break;
      // Fin programmée pile à l'échéance (résiliation en fin de période) : pas de renouvellement.
      const afterEnd = due >= endTime - 3_600_000;
      if (afterEnd && involuntary) break;
      if (due >= r.start) {
        const invoice = (cycleBySub.get(sub.id) ?? []).find((i) => Math.abs(i.created - due) <= RENEWAL_WINDOW_MS) ?? null;
        let outcome: RenewalOutcome;
        if (invoice) outcome = invoice.status === "paid" ? "réussi" : invoice.status === "draft" ? "à venir" : "échoué";
        else if (afterEnd) outcome = "annulé avant l'échéance";
        else if (due > now) outcome = "à venir";
        else outcome = "inconnu";
        rows.push({ sub, k, due, outcome, invoice });
      }
      if (afterEnd) break;
    }
  }
  return rows.sort((a, b) => a.due - b.due);
}

export function renewalSummary(rows: RenewalRow[]) {
  const count = (o: RenewalOutcome, first?: boolean) => rows.filter((x) => x.outcome === o && (first === undefined || (x.k === 1) === first)).length;
  const build = (first?: boolean) => {
    const ok = count("réussi", first);
    const failed = count("échoué", first);
    const canceled = count("annulé avant l'échéance", first);
    const unknown = count("inconnu", first);
    const upcoming = count("à venir", first);
    const due = ok + failed + canceled + unknown;
    return {
      ok,
      failed,
      canceled,
      unknown,
      upcoming,
      due,
      /** Réussis / échéances passées de la période. */
      rate: due > 0 ? ok / due : null,
      /** Réussis / (réussis + échoués) : qualité de l'encaissement. */
      paymentRate: ok + failed > 0 ? ok / (ok + failed) : null,
    };
  };
  return { all: build(), first: build(true), later: build(false) };
}

export type PaidCohort = {
  key: string;
  subs: number;
  lifetime: number;
  alive: Record<30 | 60 | 90, { alive: number; eligible: number }>;
  firstRenewal: { ok: number; failed: number; canceled: number; pending: number };
  revenueCents: number;
};

/** Cohortes par mois (YYYY-MM) ou semaine (lundi, YYYY-MM-DD) du premier paiement. */
export function paidCohorts(snap: StripeSnapshot, now: number, grain: "month" | "week", firstPaid = firstPaidBySub(snap.invoices)): PaidCohort[] {
  const keyOf = (t: number) => {
    const d = new Date(t);
    if (grain === "month") return d.toISOString().slice(0, 7);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
    return monday.toISOString().slice(0, 10);
  };
  const cohorts = new Map<string, PaidCohort>();
  const get = (key: string) => {
    let c = cohorts.get(key);
    if (!c) {
      c = {
        key,
        subs: 0,
        lifetime: 0,
        alive: { 30: { alive: 0, eligible: 0 }, 60: { alive: 0, eligible: 0 }, 90: { alive: 0, eligible: 0 } },
        firstRenewal: { ok: 0, failed: 0, canceled: 0, pending: 0 },
        revenueCents: 0,
      };
      cohorts.set(key, c);
    }
    return c;
  };
  const paidBySub = new Map<string, number>();
  for (const inv of snap.invoices) {
    if (inv.subscription && inv.status === "paid") paidBySub.set(inv.subscription, (paidBySub.get(inv.subscription) ?? 0) + inv.amountPaid);
  }
  const firstRenewals = renewalsIn(snap, { start: 0, end: Number.MAX_SAFE_INTEGER / 2 }, now, firstPaid).filter((x) => x.k === 1);
  const firstRenewalBySub = new Map(firstRenewals.map((x) => [x.sub.id, x.outcome]));
  for (const sub of snap.subs) {
    const fp = firstPaid.get(sub.id);
    if (fp === undefined) continue;
    const c = get(keyOf(fp));
    c.subs++;
    c.revenueCents += paidBySub.get(sub.id) ?? 0;
    for (const days of [30, 60, 90] as const) {
      if (fp + days * DAY_MS > now) continue;
      c.alive[days].eligible++;
      if (sub.endedAt === null || sub.endedAt > fp + days * DAY_MS) c.alive[days].alive++;
    }
    const o = firstRenewalBySub.get(sub.id);
    if (o === "réussi") c.firstRenewal.ok++;
    else if (o === "échoué") c.firstRenewal.failed++;
    else if (o === "annulé avant l'échéance") c.firstRenewal.canceled++;
    else c.firstRenewal.pending++;
  }
  for (const o of snap.oneTime) {
    const c = get(keyOf(o.created));
    c.lifetime++;
    c.revenueCents += o.amountCents;
  }
  return [...cohorts.values()].sort((a, b) => b.key.localeCompare(a.key));
}

/** Clients avec plusieurs abonnements en cours en même temps (doublon probable). */
export function duplicateSubs(subs: SubRecord[], now: number): { customer: string; userId: string | null; ids: string[] }[] {
  const byCustomer = new Map<string, SubRecord[]>();
  for (const s of subs) {
    if (!activeAt(s, now)) continue;
    const list = byCustomer.get(s.customer) ?? [];
    list.push(s);
    byCustomer.set(s.customer, list);
  }
  return [...byCustomer.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([customer, list]) => ({ customer, userId: list[0].userId, ids: list.map((s) => s.id) }));
}
