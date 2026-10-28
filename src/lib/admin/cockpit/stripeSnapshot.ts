import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import type { BillingInterval, StripeSnapshot, SubRecord } from "@/lib/admin/cockpit/types";
import { isStageioInvoice } from "@/lib/admin/stageioInvoice";

// Source de vérité des paiements et des abonnements : Stripe. Le compte est
// partagé avec d'autres sites : un objet n'est gardé que s'il appartient à
// un compte Stageio (supabase_user_id des métadonnées de l'abonnement, ou
// client Stripe noté sur un profil, ou session de paiement dont
// client_reference_id est un profil). Toutes les générations de prix
// (hebdo à 3,50 €, mensuel à 7,99 € puis 12,79 €, accès à vie) sont donc
// incluses sans liste de prix à tenir à jour.
//
// Gardé 30 min en cache (bouton « Actualiser » dans le cockpit) : une
// lecture complète fait plusieurs dizaines d'appels à l'API Stripe.

export const COCKPIT_STRIPE_TAG = "cockpit-stripe";
// Premiers paiements Stageio : septembre 2026. Marge d'un mois.
const SINCE = Date.parse("2026-08-01T00:00:00Z");

const ms = (s: number | null | undefined) => (s ? s * 1000 : null);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

/** Montant d'une période ramené au mois (convention : 52 semaines et 365 jours par an). */
export function monthlyAmount(amountCents: number, interval: BillingInterval, intervalCount: number): number {
  const count = Math.max(1, intervalCount);
  switch (interval) {
    case "day":
      return (amountCents * 365) / 12 / count;
    case "week":
      return (amountCents * 52) / 12 / count;
    case "year":
      return amountCents / 12 / count;
    default:
      return amountCents / count;
  }
}

function recurringDiscount(sub: Stripe.Subscription, amount: number): number {
  let out = amount;
  for (const d of sub.discounts ?? []) {
    if (typeof d === "string") continue;
    const coupon = d.source?.coupon;
    if (!coupon || typeof coupon === "string" || coupon.duration === "once") continue;
    if (d.end && d.end * 1000 < Date.now()) continue;
    if (coupon.percent_off) out = out * (1 - coupon.percent_off / 100);
    else if (coupon.amount_off) out = Math.max(0, out - coupon.amount_off);
  }
  return Math.round(out);
}

function toSubRecord(s: Stripe.Subscription, userId: string | null): SubRecord {
  const items = s.items.data;
  const first = items[0];
  const interval = (first?.price.recurring?.interval ?? "month") as BillingInterval;
  const intervalCount = first?.price.recurring?.interval_count ?? 1;
  const gross = items.reduce((sum, it) => sum + (it.price.unit_amount ?? 0) * (it.quantity ?? 1), 0);
  const amountCents = recurringDiscount(s, gross);
  return {
    id: s.id,
    customer: idOf(s.customer) ?? "",
    userId,
    status: s.status,
    priceIds: items.map((it) => it.price.id),
    amountCents,
    currency: s.currency,
    interval,
    intervalCount,
    mrrCents: Math.round(monthlyAmount(amountCents, interval, intervalCount)),
    created: s.created * 1000,
    startDate: s.start_date * 1000,
    anchor: s.billing_cycle_anchor * 1000,
    canceledAt: ms(s.canceled_at),
    endedAt: ms(s.ended_at),
    cancelAt: ms(s.cancel_at),
    cancelAtPeriodEnd: s.cancel_at_period_end,
    currentPeriodEnd: ms(first?.current_period_end),
    cancelReason: s.cancellation_details?.reason ?? null,
    feedback: s.cancellation_details?.feedback ?? null,
    paused: !!s.pause_collection,
  };
}

async function compute(): Promise<StripeSnapshot> {
  const stripe = getStripeClient();
  const db = createAdminClient();
  const since = Math.floor(SINCE / 1000);

  const profiles = await fetchAllRowsByIdCursor<{ id: string; stripe_customer_id: string | null }>((afterId, limit) => {
    let q = db.from("profiles").select("id, stripe_customer_id");
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit) as unknown as PromiseLike<{
      data: { id: string; stripe_customer_id: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });
  const profileIds = new Set(profiles.map((p) => p.id));
  const userByCustomer = new Map<string, string>();
  for (const p of profiles) if (p.stripe_customer_id) userByCustomer.set(p.stripe_customer_id, p.id);

  const subs: SubRecord[] = [];
  let otherCurrencySubs = 0;
  for await (const s of stripe.subscriptions.list({ status: "all", created: { gte: since }, limit: 100, expand: ["data.discounts"] })) {
    const customer = idOf(s.customer) ?? "";
    const metaUser = s.metadata?.supabase_user_id;
    const userId = metaUser && profileIds.has(metaUser) ? metaUser : (userByCustomer.get(customer) ?? null);
    if (!userId) continue;
    if (s.currency !== "eur") otherCurrencySubs++;
    subs.push(toSubRecord(s, userId));
    if (!userByCustomer.has(customer)) userByCustomer.set(customer, userId);
  }

  const oneTime: StripeSnapshot["oneTime"] = [];
  for await (const cs of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
    const userId = cs.client_reference_id;
    if (!userId || !profileIds.has(userId) || cs.mode !== "payment" || cs.payment_status !== "paid") continue;
    const customer = idOf(cs.customer);
    if (customer && !userByCustomer.has(customer)) userByCustomer.set(customer, userId);
    oneTime.push({
      id: cs.id,
      customer,
      userId,
      amountCents: cs.amount_total ?? 0,
      currency: cs.currency ?? "eur",
      created: cs.created * 1000,
      invoice: idOf(cs.invoice),
    });
  }

  const invoices: StripeSnapshot["invoices"] = [];
  for await (const inv of stripe.invoices.list({ created: { gte: since }, limit: 100 })) {
    const customer = idOf(inv.customer);
    // Compte relié à un profil, ou produit Stageio (compte supprimé, client non relié).
    if (!customer || (!userByCustomer.has(customer) && !isStageioInvoice(inv))) continue;
    invoices.push({
      id: inv.id ?? "",
      customer,
      subscription: idOf(inv.parent?.subscription_details?.subscription),
      billingReason: inv.billing_reason,
      status: inv.status ?? "draft",
      amountPaid: inv.amount_paid,
      amountDue: inv.amount_due,
      currency: inv.currency,
      created: inv.created * 1000,
      paidAt: ms(inv.status_transitions?.paid_at),
      attemptCount: inv.attempt_count,
    });
  }

  const chargeCustomer = (c: string | Stripe.Charge | null | undefined) => (c && typeof c !== "string" ? idOf(c.customer) : null);

  const refunds: StripeSnapshot["refunds"] = [];
  for await (const r of stripe.refunds.list({ created: { gte: since }, limit: 100, expand: ["data.charge"] })) {
    const customer = chargeCustomer(r.charge);
    if (!customer || !userByCustomer.has(customer) || r.status === "failed" || r.status === "canceled") continue;
    refunds.push({ id: r.id, customer, amount: r.amount, created: r.created * 1000 });
  }

  const disputes: StripeSnapshot["disputes"] = [];
  for await (const d of stripe.disputes.list({ created: { gte: since }, limit: 100, expand: ["data.charge"] })) {
    const customer = chargeCustomer(d.charge);
    if (!customer || !userByCustomer.has(customer)) continue;
    disputes.push({ id: d.id, customer, amount: d.amount, status: d.status, created: d.created * 1000 });
  }

  console.log(
    "cockpit stripe snapshot",
    JSON.stringify({ subs: subs.length, invoices: invoices.length, oneTime: oneTime.length, refunds: refunds.length, disputes: disputes.length }),
  );
  return { computedAt: Date.now(), since: SINCE, subs, invoices, oneTime, refunds, disputes, otherCurrencySubs };
}

export const getStripeSnapshot = unstable_cache(compute, ["cockpit-stripe-snapshot-v2"], {
  revalidate: 1800,
  tags: [COCKPIT_STRIPE_TAG],
});
