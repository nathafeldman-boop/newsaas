import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { REGULAR_PRICE_IDS } from "@/lib/pricing/plans";

// Rétention (SOP 27 « Churn & rétention : la lecture par cohortes »).
// Source de vérité : les abonnements Stripe eux-mêmes (date de début,
// demande d'annulation, fin réelle), filtrés sur les prix Stageio -- le
// compte Stripe sert aussi à d'autres projets. L'accès à vie (paiement
// unique) n'est pas un abonnement : il ne churne pas et reste hors cohortes.

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

function stageioPriceIds(): string[] {
  return [process.env.STRIPE_PRICE_ID, process.env.STRIPE_PRICE_ID_WEEKLY, REGULAR_PRICE_IDS.monthly]
    .map((p) => p?.trim())
    .filter((p): p is string => !!p);
}

async function stageioCustomers(ids: string[]): Promise<Set<string>> {
  const admin = createAdminClient();
  const owned = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await admin.from("profiles").select("stripe_customer_id").in("stripe_customer_id", ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) if (p.stripe_customer_id) owned.add(p.stripe_customer_id);
  }
  return owned;
}

export const getRetentionStats = unstable_cache(
  async (): Promise<RetentionStats> => {
    const stripe = getStripeClient();
    const now = Date.now();
    const since = Math.floor((now - 365 * DAY_MS) / 1000);

    const subs: Stripe.Subscription[] = [];
    for (const price of stageioPriceIds()) {
      subs.push(
        ...(await stripe.subscriptions.list({ price, status: "all", created: { gte: since }, limit: 100 }).autoPagingToArray({ limit: 5000 })),
      );
    }

    const byMonth = new Map<string, RetentionCohort>();
    const first48h = { started: 0, canceled: 0 };
    for (const s of subs) {
      // Jamais payé (carte refusée à la création) : pas un client perdu.
      if (s.status === "incomplete" || s.status === "incomplete_expired") continue;
      const start = s.start_date * 1000;
      const month = new Date(start).toISOString().slice(0, 7);
      const cohort = byMonth.get(month) ?? {
        month,
        started: 0,
        canceled48h: 0,
        alive: { 30: { alive: 0, eligible: 0 }, 60: { alive: 0, eligible: 0 }, 90: { alive: 0, eligible: 0 } },
      };
      cohort.started += 1;
      // canceled_at = moment de la demande d'annulation (même si l'accès
      // court jusqu'à la fin de la période payée).
      const canceledFast = !!s.canceled_at && s.canceled_at * 1000 - start <= 2 * DAY_MS;
      if (canceledFast) cohort.canceled48h += 1;
      if (start >= now - 30 * DAY_MS && start <= now - 2 * DAY_MS) {
        first48h.started += 1;
        if (canceledFast) first48h.canceled += 1;
      }
      // Fin réelle de l'accès payé : déjà terminé, ou programmé.
      const end = s.ended_at ? s.ended_at * 1000 : s.cancel_at ? s.cancel_at * 1000 : null;
      for (const days of HORIZONS) {
        if (start + days * DAY_MS > now) continue;
        cohort.alive[days].eligible += 1;
        if (end === null || end > start + days * DAY_MS) cohort.alive[days].alive += 1;
      }
      byMonth.set(month, cohort);
    }

    // Remboursements des 30 derniers jours, clients Stageio seulement.
    const refundsList = await stripe.refunds
      .list({ created: { gte: Math.floor((now - 30 * DAY_MS) / 1000) }, limit: 100, expand: ["data.charge"] })
      .autoPagingToArray({ limit: 500 });
    const refundCustomers = refundsList
      .map((r) => (typeof r.charge === "object" && r.charge ? (typeof r.charge.customer === "string" ? r.charge.customer : r.charge.customer?.id) : null))
      .filter((c): c is string => !!c);
    const owned = await stageioCustomers([...new Set(refundCustomers)]);
    const refunds = { count: 0, cents: 0 };
    for (const r of refundsList) {
      const charge = typeof r.charge === "object" ? r.charge : null;
      const customer = charge ? (typeof charge.customer === "string" ? charge.customer : charge.customer?.id) : null;
      if (customer && owned.has(customer) && r.status !== "failed" && r.status !== "canceled") {
        refunds.count += 1;
        refunds.cents += r.amount;
      }
    }

    return { cohorts: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)), first48h, refunds };
  },
  ["admin-retention-stats-v1"],
  { revalidate: 1800 },
);

// Ventes du jour : nouvelles ventes et renouvellements séparés (« ne jamais
// mélanger nouvelles ventes et renouvellements dans la même ligne »). Une
// facture est un renouvellement si le client avait déjà payé avant.
export type DailySales = { day: string; newSales: number; newCents: number; renewals: number; renewalCents: number };

export const getDailySales = unstable_cache(
  async (): Promise<DailySales[]> => {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 14 * DAY_MS);
    const { data: invoices, error } = await admin
      .from("stripe_processed_invoices")
      .select("stripe_customer_id, amount_cents, created_at")
      .gte("created_at", since.toISOString())
      .gt("amount_cents", 0)
      .order("created_at")
      .limit(5000);
    if (error) throw new Error(error.message);

    const customers = [...new Set((invoices ?? []).map((i) => i.stripe_customer_id))];
    const owned = await stageioCustomers(customers);
    const seen = new Set<string>();
    for (let i = 0; i < customers.length; i += 200) {
      const { data: earlier, error: earlierError } = await admin
        .from("stripe_processed_invoices")
        .select("stripe_customer_id")
        .in("stripe_customer_id", customers.slice(i, i + 200))
        .lt("created_at", since.toISOString())
        .gt("amount_cents", 0)
        .limit(5000);
      if (earlierError) throw new Error(earlierError.message);
      for (const e of earlier ?? []) seen.add(e.stripe_customer_id);
    }

    const days = new Map<string, DailySales>();
    for (const inv of invoices ?? []) {
      if (!owned.has(inv.stripe_customer_id)) continue;
      const day = new Date(inv.created_at).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
      const d = days.get(day) ?? { day, newSales: 0, newCents: 0, renewals: 0, renewalCents: 0 };
      if (seen.has(inv.stripe_customer_id)) {
        d.renewals += 1;
        d.renewalCents += inv.amount_cents;
      } else {
        d.newSales += 1;
        d.newCents += inv.amount_cents;
        seen.add(inv.stripe_customer_id);
      }
      days.set(day, d);
    }
    return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
  },
  ["admin-daily-sales-v1"],
  { revalidate: 900 },
);
