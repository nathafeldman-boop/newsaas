import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { isStageioInvoice } from "@/lib/admin/stageioInvoice";

// Ventes réelles depuis Stripe (Nathan, 24/10 : « prends les personnes qui
// ont réellement payé », le compteur « payant réel » ne garde que les
// accès en cours et baisse à chaque abonnement arrêté). Compte Stripe
// partagé avec d'autres sites : seules comptent les sessions de paiement
// dont client_reference_id est un compte Stageio. Montants en euros : ceux
// des sessions et des factures (le client peut voir sa devise locale, le
// prix reste en euros).
const SINCE = Math.floor(Date.parse("2026-09-01T00:00:00Z") / 1000);

export type StripeTotals = {
  /** Comptes Stageio avec au moins un paiement réussi. */
  payers: number;
  lifetimePayers: number;
  subscriptionPayers: number;
  /** Encaissé : 1ers paiements, renouvellements et accès à vie, en centimes. */
  revenueCents: number;
  refundedCents: number;
  /** Payeurs Stripe dont le profil n'a aucun paiement noté (webhook manqué). */
  missingInDb: { userId: string; email: string | null }[];
  computedAt: string;
};

async function compute(): Promise<StripeTotals> {
  const stripe = getStripeClient();
  const db = createAdminClient();
  const profiles = await fetchAllRowsByIdCursor<{ id: string; email: string | null; total_paid_cents: number }>((afterId, limit) => {
    let q = db.from("profiles").select("id, email, total_paid_cents");
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit) as unknown as PromiseLike<{
      data: { id: string; email: string | null; total_paid_cents: number }[] | null;
      error: { message: string } | null;
    }>;
  });
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const payers = new Set<string>();
  const lifetime = new Set<string>();
  const subscription = new Set<string>();
  const customers = new Set<string>();
  let revenueCents = 0;
  for await (const s of stripe.checkout.sessions.list({ created: { gte: SINCE }, limit: 100 })) {
    const session = s as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    if (!userId || !byId.has(userId) || session.payment_status !== "paid") continue;
    payers.add(userId);
    (session.mode === "payment" ? lifetime : subscription).add(userId);
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (customer) customers.add(customer);
    // Accès à vie sans facture : le montant de la session.
    if (session.mode === "payment" && !session.invoice) revenueCents += session.amount_total ?? 0;
  }

  // Toutes les factures payées de ces clients : 1ers paiements,
  // renouvellements, et accès à vie avec facture.
  for await (const inv of stripe.invoices.list({ created: { gte: SINCE }, status: "paid", limit: 100 })) {
    const customer = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
    // Comptes reliés, plus tout produit Stageio (compte supprimé depuis, 28/10).
    if ((customer && customers.has(customer)) || isStageioInvoice(inv)) revenueCents += inv.amount_paid;
  }

  let refundedCents = 0;
  for await (const r of stripe.refunds.list({ created: { gte: SINCE }, limit: 100 })) {
    if (r.status !== "succeeded" || !r.charge) continue;
    const charge = typeof r.charge === "string" ? await stripe.charges.retrieve(r.charge) : r.charge;
    const customer = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
    if (customer && customers.has(customer)) refundedCents += r.amount;
  }

  const missingInDb = [...payers]
    .filter((id) => (byId.get(id)?.total_paid_cents ?? 0) <= 0)
    .map((id) => ({ userId: id, email: byId.get(id)?.email ?? null }));

  console.log(
    "stripe totals",
    JSON.stringify({ payers: payers.size, lifetime: lifetime.size, subscription: subscription.size, revenueCents, refundedCents, missingInDb: missingInDb.length }),
  );
  return {
    payers: payers.size,
    lifetimePayers: lifetime.size,
    subscriptionPayers: subscription.size,
    revenueCents,
    refundedCents,
    missingInDb,
    computedAt: new Date().toISOString(),
  };
}

// Plusieurs dizaines d'appels Stripe : gardé 6 h. La page /admin/stripe le
// calcule (60 s permises) ; le dashboard ne fait que relire le cache.
export const getStripeTotals = unstable_cache(compute, ["admin-stripe-totals-v2"], { revalidate: 6 * 3600 });
