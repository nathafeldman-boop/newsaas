import type { SubRecord } from "@/lib/admin/cockpit/types";

// Signaux de satisfaction tirés de Stripe (page admin « Satisfaction »,
// 29/10). Fonctions pures, testables.

const DAY = 86_400_000;

export const FEEDBACK_LABELS: Record<string, string> = {
  too_expensive: "Trop cher",
  unused: "Pas assez utilisé",
  missing_features: "Fonctionnalités manquantes",
  switched_service: "Passé à un autre service",
  too_complex: "Trop compliqué",
  low_quality: "Qualité insuffisante",
  customer_service: "Service client",
  other: "Autre",
};

/**
 * Résiliations rapides : parmi les abonnements payés commencés dans la
 * période, part de ceux dont la résiliation a été demandée en moins de 24 h,
 * 7 jours, 30 jours après le début.
 */
export function earlyCancellations(subs: SubRecord[], range: { start: number; end: number }) {
  const started = subs.filter((s) => s.startDate >= range.start && s.startDate < range.end);
  const within = (ms: number) => started.filter((s) => s.canceledAt !== null && s.canceledAt - s.startDate < ms).length;
  return { started: started.length, day1: within(DAY), day7: within(7 * DAY), day30: within(30 * DAY), any: started.filter((s) => s.canceledAt !== null).length };
}

/** Motifs et commentaires des résiliations demandées dans la période (les plus récentes d'abord). */
export function cancelReasons(subs: SubRecord[], range: { start: number; end: number }) {
  const asked = subs.filter((s) => s.canceledAt !== null && s.canceledAt >= range.start && s.canceledAt < range.end);
  const counts = new Map<string, number>();
  for (const s of asked) {
    const key = s.feedback ?? "aucun";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    total: asked.length,
    byReason: [...counts.entries()].map(([key, n]) => ({ key, label: key === "aucun" ? "Sans motif" : (FEEDBACK_LABELS[key] ?? key), n })).sort((a, b) => b.n - a.n),
    comments: asked
      .filter((s) => s.cancelComment)
      .sort((a, b) => (b.canceledAt ?? 0) - (a.canceledAt ?? 0))
      .map((s) => ({ at: s.canceledAt!, userId: s.userId, comment: s.cancelComment!, daysAfterStart: Math.floor((s.canceledAt! - s.startDate) / DAY) })),
  };
}
