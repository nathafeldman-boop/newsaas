import { revenueIn, movementIn, firstPaidBySub, DAY_MS, type Range } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

// Historique mois par mois et revenu total (28/10, Nathan : « l'argent
// qu'on a fait chaque mois, le nombre d'utilisateurs qu'on a fait chaque
// mois, la prévisualisation de ce qu'on va faire », « une grosse jauge en
// haut : revenu total de Stageio »). Fonctions pures, testables. Le réel
// vient de Stripe (net des remboursements) et des profils ; la prévision le
// dit toujours et part de rythmes mesurés, jamais d'un chiffre inventé.

/** Objectif global par défaut (modifiable dans Objectifs) : 100 000 € encaissés, le défi d'un an (29/10). */
export const DEFAULT_GLOBAL_GOAL_CENTS = 10_000_000;

export type HistoryRow = {
  key: string;
  kind: "past" | "current" | "forecast";
  /** Encaissé net du mois (0 pour un mois à venir). */
  revenueCents: number;
  renewalCents: number;
  /** Nouveaux payants : 1ers paiements d'abonnement et achats à vie. */
  newPayers: number;
  /** Inscrits du mois ; null si la lecture des comptes a échoué. */
  signups: number | null;
  /** Prévision du mois entier (mois en cours et à venir), sinon null. */
  forecast: { revenueCents: number; signups: number | null; newPayers: number | null } | null;
};

/** Revenu total depuis le premier paiement : encaissé net (remboursements déduits). */
export function totalRevenue(snap: StripeSnapshot, now: number): { netCents: number; grossCents: number; refundedCents: number } {
  const all = revenueIn(snap, { start: 0, end: now + 1 });
  return { netCents: all.netCents, grossCents: all.recurringCents + all.oneTimeCents, refundedCents: all.refundedCents };
}

/** Rythmes mesurés (par jour) qui servent à la prévision. */
export type DailyRates = { firstPaymentCents: number; firstPayments: number; signups: number };

/**
 * Prévision d'un mois entier :
 * - mois en cours : encaissé à date + projection (rythme des 7 derniers jours,
 *   déjà calculée par l'onglet Objectifs) ; inscrits et payants au prorata ;
 * - mois à venir : renouvellements attendus des abonnés actuels + nouveaux
 *   paiements au rythme des 30 derniers jours.
 */
export function forecastFor(params: {
  kind: "current" | "forecast";
  days: number;
  elapsedDays: number;
  actual: { revenueCents: number; signups: number | null; newPayers: number };
  projectionCents: number | null;
  renewalCents: number;
  rates: DailyRates | null;
}): HistoryRow["forecast"] {
  const { kind, days, elapsedDays, actual, rates } = params;
  if (kind === "current") {
    const share = elapsedDays > 0 ? days / elapsedDays : null;
    return {
      revenueCents: Math.max(actual.revenueCents, params.projectionCents ?? actual.revenueCents),
      signups: actual.signups !== null && share !== null ? Math.round(actual.signups * share) : null,
      newPayers: share !== null ? Math.round(actual.newPayers * share) : null,
    };
  }
  if (!rates) return { revenueCents: params.renewalCents, signups: null, newPayers: null };
  return {
    revenueCents: Math.round(params.renewalCents + rates.firstPaymentCents * days),
    signups: Math.round(rates.signups * days),
    newPayers: Math.round(rates.firstPayments * days),
  };
}

/** Réel d'un mois : encaissé net, renouvellements, nouveaux payants. */
export function actualFor(snap: StripeSnapshot, range: Range, firstPaid = firstPaidBySub(snap.invoices)) {
  const rev = revenueIn(snap, range);
  const mv = movementIn(snap, range, firstPaid);
  return { revenueCents: rev.netCents, renewalCents: mv.renewalCents, newPayers: mv.newSubs + mv.lifetimeBuyers };
}

export const daysIn = (range: Range) => Math.round((range.end - range.start) / DAY_MS);
