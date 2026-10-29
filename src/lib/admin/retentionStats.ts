import { getStripeSnapshot } from "@/lib/admin/cockpit/stripeSnapshot";

// Rétention (SOP 27 « Churn & rétention : la lecture par cohortes »).
// Source de vérité : les abonnements Stripe eux-mêmes (date de début,
// demande d'annulation, fin réelle), lus dans le relevé du cockpit. Tout le
// compte Stripe est à Stageio (Nathan, 29/10) : chaque abonnement et chaque
// paiement compte, quel que soit le prix (quotidien, hebdo, mensuel) et
// même si le compte a été supprimé depuis. L'accès à vie (paiement unique)
// n'est pas un abonnement : il ne churne pas et reste hors cohortes.

const DAY_MS = 24 * 60 * 60 * 1000;
const HORIZONS = [30, 60, 90] as const;
export type Horizon = (typeof HORIZONS)[number];

export type RetentionCohort = {
  month: string;
  started: number;
  canceled48h: number;
  alive: Record<Horizon, { alive: number; eligible: number }>;
};

export type RetentionStats = {
  cohorts: RetentionCohort[];
  // Abonnements des 30 derniers jours (et vieux d'au moins 48 h) : part
  // annulée dans les 48 h. Repère de la fiche : 63 % vu chez un SaaS B2C,
  // cible 20-30 %.
  first48h: { started: number; canceled: number };
  refunds: { count: number; cents: number };
};

export async function getRetentionStats(): Promise<RetentionStats> {
  const snap = await getStripeSnapshot();
  const now = Date.now();

  const byMonth = new Map<string, RetentionCohort>();
  const first48h = { started: 0, canceled: 0 };
  for (const s of snap.subs) {
    // Jamais payé (carte refusée à la création) : pas un client perdu.
    if (s.status === "incomplete" || s.status === "incomplete_expired") continue;
    const start = s.startDate;
    const month = new Date(start).toISOString().slice(0, 7);
    const cohort = byMonth.get(month) ?? {
      month,
      started: 0,
      canceled48h: 0,
      alive: { 30: { alive: 0, eligible: 0 }, 60: { alive: 0, eligible: 0 }, 90: { alive: 0, eligible: 0 } },
    };
    cohort.started += 1;
    // canceledAt = moment de la demande d'annulation (même si l'accès
    // court jusqu'à la fin de la période payée).
    const canceledFast = s.canceledAt !== null && s.canceledAt - start <= 2 * DAY_MS;
    if (canceledFast) cohort.canceled48h += 1;
    if (start >= now - 30 * DAY_MS && start <= now - 2 * DAY_MS) {
      first48h.started += 1;
      if (canceledFast) first48h.canceled += 1;
    }
    // Fin réelle de l'accès payé : déjà terminé, ou programmé.
    const end = s.endedAt ?? s.cancelAt;
    for (const days of HORIZONS) {
      if (start + days * DAY_MS > now) continue;
      cohort.alive[days].eligible += 1;
      if (end === null || end > start + days * DAY_MS) cohort.alive[days].alive += 1;
    }
    byMonth.set(month, cohort);
  }

  // Remboursements des 30 derniers jours.
  const recent = snap.refunds.filter((r) => r.created >= now - 30 * DAY_MS);
  const refunds = { count: recent.length, cents: recent.reduce((sum, r) => sum + r.amount, 0) };

  return { cohorts: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)), first48h, refunds };
}

// Ventes du jour : nouvelles ventes et renouvellements séparés (« ne jamais
// mélanger nouvelles ventes et renouvellements dans la même ligne »). Chaque
// facture payée du compte Stripe : renouvellement si c'est une échéance
// d'abonnement (2e paiement et suivants), nouvelle vente sinon (1er
// paiement, accès à vie).
export type DailySales = { day: string; newSales: number; newCents: number; renewals: number; renewalCents: number };

export async function getDailySales(): Promise<DailySales[]> {
  const snap = await getStripeSnapshot();
  const since = Date.now() - 14 * DAY_MS;
  const days = new Map<string, DailySales>();
  for (const inv of snap.invoices) {
    const at = inv.paidAt ?? inv.created;
    if (inv.status !== "paid" || inv.amountPaid <= 0 || at < since) continue;
    const day = new Date(at).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
    const d = days.get(day) ?? { day, newSales: 0, newCents: 0, renewals: 0, renewalCents: 0 };
    if (inv.subscription && inv.billingReason === "subscription_cycle") {
      d.renewals += 1;
      d.renewalCents += inv.amountPaid;
    } else {
      d.newSales += 1;
      d.newCents += inv.amountPaid;
    }
    days.set(day, d);
  }
  // Accès à vie sans facture (achats d'avant le 21/10).
  const invoiced = new Set(snap.invoices.map((i) => i.id));
  for (const o of snap.oneTime) {
    if (o.created < since || (o.invoice && invoiced.has(o.invoice))) continue;
    const day = new Date(o.created).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
    const d = days.get(day) ?? { day, newSales: 0, newCents: 0, renewals: 0, renewalCents: 0 };
    d.newSales += 1;
    d.newCents += o.amountCents;
    days.set(day, d);
  }
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
}
