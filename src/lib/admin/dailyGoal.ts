import { revenueIn, type Range } from "@/lib/admin/cockpit/metrics";
import { startOfParisDay } from "@/lib/admin/cockpit/format";
import { CHALLENGE } from "@/lib/admin/challenge";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

// Objectif du jour (30/10, Nathan : « dès qu'on ouvre le dashboard […]
// demain, pour réussir notre objectif, on doit faire 40 € […] le mois
// prochain 3 000 € : il faut qu'on encaisse, renouvellements plus
// paiements, 100 € par jour »). Ce qu'il reste à encaisser pour l'objectif
// du mois, au début de la journée, réparti sur les jours restants
// (aujourd'hui compris) : fixe pendant la journée, la jauge se remplit avec
// tout ce qui est encaissé aujourd'hui (nets des remboursements). Sans
// objectif pour le mois, ou une fois atteint : le rythme du défi d'un an.

const DAY_MS = 86_400_000;

export type DailyGoal = {
  source: "mois" | "defi" | "aucun";
  targetCents: number;
  todayCents: number;
  todayPayments: number;
  reached: boolean;
  /** Jours restants dans le mois, aujourd'hui compris. */
  daysToGo: number;
  monthGoalCents: number | null;
  monthDoneCents: number;
  monthBeforeTodayCents: number;
};

/** Jours (heure de Paris) de `from` à la fin de `range`, le jour de `from` compris. */
export function parisDaysLeft(from: number, range: Range): number {
  let n = 0;
  for (let t = startOfParisDay(from); t < range.end; t = startOfParisDay(t + DAY_MS + 3 * 3_600_000)) n++;
  return n;
}

/** Cible du jour : reste à encaisser ÷ jours restants, arrondi à l'euro supérieur. */
export function dailyTarget(remainingCents: number, daysToGo: number): number {
  if (remainingCents <= 0 || daysToGo <= 0) return 0;
  return Math.ceil(remainingCents / daysToGo / 100) * 100;
}

export function computeDailyGoal(params: {
  monthGoalCents: number | null;
  monthBeforeTodayCents: number;
  todayCents: number;
  todayPayments: number;
  daysToGo: number;
  /** Encaissé total avant aujourd'hui, et jours restants du défi (aujourd'hui compris). */
  challenge: { totalBeforeTodayCents: number; daysLeft: number };
}): DailyGoal {
  const { monthGoalCents, monthBeforeTodayCents, todayCents, todayPayments, daysToGo, challenge } = params;
  const monthRemaining = monthGoalCents === null ? 0 : monthGoalCents - monthBeforeTodayCents;
  const challengeTarget = dailyTarget(CHALLENGE.goalCents - challenge.totalBeforeTodayCents, challenge.daysLeft);
  const source: DailyGoal["source"] = monthRemaining > 0 ? "mois" : challengeTarget > 0 ? "defi" : "aucun";
  const targetCents = source === "mois" ? dailyTarget(monthRemaining, daysToGo) : source === "defi" ? challengeTarget : 0;
  return {
    source,
    targetCents,
    todayCents,
    todayPayments,
    reached: targetCents > 0 && todayCents >= targetCents,
    daysToGo,
    monthGoalCents,
    monthDoneCents: monthBeforeTodayCents + todayCents,
    monthBeforeTodayCents,
  };
}

/** Paiements réussis dans la période : factures payées et achats à vie sans facture. */
export function paymentsIn(snap: StripeSnapshot, r: Range): number {
  const at = (t: number) => t >= r.start && t < r.end;
  const invoiced = new Set(snap.invoices.map((i) => i.id));
  return (
    snap.invoices.filter((i) => i.status === "paid" && i.amountPaid > 0 && at(i.paidAt ?? i.created)).length +
    snap.oneTime.filter((o) => at(o.created) && !(o.invoice && invoiced.has(o.invoice))).length
  );
}

/** Objectif du jour à partir du relevé Stripe et de l'objectif du mois. */
export function dailyGoalFrom(snap: StripeSnapshot, month: Range, monthGoalCents: number | null, now: number): DailyGoal {
  const todayStart = startOfParisDay(now);
  const today = { start: todayStart, end: now + 1 };
  return computeDailyGoal({
    monthGoalCents,
    monthBeforeTodayCents: revenueIn(snap, { start: month.start, end: todayStart }).netCents,
    todayCents: revenueIn(snap, today).netCents,
    todayPayments: paymentsIn(snap, today),
    daysToGo: parisDaysLeft(now, month),
    challenge: {
      totalBeforeTodayCents: revenueIn(snap, { start: 0, end: todayStart }).netCents,
      daysLeft: Math.max(1, Math.ceil((CHALLENGE.end - todayStart) / DAY_MS)),
    },
  });
}
