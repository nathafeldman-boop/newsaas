import { unstable_cache } from "next/cache";
import { COCKPIT_STRIPE_TAG, getStripeSnapshot } from "@/lib/admin/cockpit/stripeSnapshot";
import { paidSubs } from "@/lib/admin/cockpit/metrics";
import { profilesByIds } from "@/lib/admin/cockpit/db";
import { totalRevenue } from "@/lib/admin/history";

// Ventes réelles depuis Stripe (Nathan, 24/10 : « prends les personnes qui
// ont réellement payé »). Depuis le 29/10 (« on n'a pas de deuxième SaaS,
// chaque paiement vaut pour Stageio ») : le même relevé Stripe que le
// cockpit, où chaque paiement du compte compte (1ers paiements,
// renouvellements quotidiens, hebdo et mensuels, accès à vie), relié à un
// compte ou non. Les payeurs, eux, restent des comptes Stageio (taux
// inscrits → payants).

export type StripeTotals = {
  /** Comptes Stageio avec au moins un paiement réussi. */
  payers: number;
  lifetimePayers: number;
  subscriptionPayers: number;
  /** Encaissé : tous les paiements réussis du compte Stripe, en centimes. */
  revenueCents: number;
  refundedCents: number;
  /** Payeurs Stripe dont le profil n'a aucun paiement noté (webhook manqué). */
  missingInDb: { userId: string; email: string | null }[];
  computedAt: string;
};

async function compute(): Promise<StripeTotals> {
  const snap = await getStripeSnapshot();
  const now = Date.now();
  const subscription = new Set(paidSubs(snap).map((s) => s.userId).filter((id): id is string => !!id));
  const lifetime = new Set(snap.oneTime.map((o) => o.userId));
  const payers = new Set([...subscription, ...lifetime]);
  const total = totalRevenue(snap, now);
  const profiles = await profilesByIds([...payers]);
  const missingInDb = [...payers]
    .filter((id) => profiles.has(id) && (profiles.get(id)?.total_paid_cents ?? 0) <= 0)
    .map((id) => ({ userId: id, email: profiles.get(id)?.email ?? null }));
  return {
    payers: payers.size,
    lifetimePayers: lifetime.size,
    subscriptionPayers: subscription.size,
    revenueCents: total.grossCents,
    refundedCents: total.refundedCents,
    missingInDb,
    computedAt: new Date(snap.computedAt).toISOString(),
  };
}

// Relit le relevé du cockpit : même chiffre partout, jeté avec lui à chaque paiement.
export const getStripeTotals = unstable_cache(compute, ["admin-stripe-totals-v3"], { revalidate: 600, tags: [COCKPIT_STRIPE_TAG] });
