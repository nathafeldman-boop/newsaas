import { DAY_MS, activeAt, firstPaidBySub, paidSubs } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

// Qui reçoit les messages de départ (25/10), d'après l'instantané Stripe.
// Pur et testable : les exclusions qui demandent la base (désinscrits des
// e-mails, « j'ai trouvé », déjà prévenus) sont faites à l'envoi.

export const WINBACK_WINDOW_DAYS = 60;

/** Abonnements payants en cours dont la résiliation est programmée. */
export function scheduledCandidates(snap: StripeSnapshot, now: number) {
  return paidSubs(snap, firstPaidBySub(snap.invoices)).filter(
    (s) => s.userId && activeAt(s, now) && s.status !== "past_due" && s.status !== "unpaid" && (s.cancelAt !== null || s.cancelAtPeriodEnd),
  );
}

/**
 * Anciens abonnés partis ces derniers jours, un par compte (dernier
 * abonnement terminé). Exclus : ceux qui ont un abonnement en cours (revenus
 * ou passés à une autre formule) et ceux qui ont un accès à vie.
 */
export function winbackCandidates(snap: StripeSnapshot, now: number, days = WINBACK_WINDOW_DAYS): { userId: string; subscriptionId: string; endedAt: number }[] {
  const paid = paidSubs(snap, firstPaidBySub(snap.invoices));
  const stillPaying = new Set(paid.filter((s) => activeAt(s, now)).map((s) => s.userId));
  const lifetime = new Set(snap.oneTime.map((o) => o.userId));
  const latest = new Map<string, { userId: string; subscriptionId: string; endedAt: number }>();
  for (const s of paid) {
    if (!s.userId || s.endedAt === null || s.endedAt > now || s.endedAt < now - days * DAY_MS) continue;
    if (stillPaying.has(s.userId) || lifetime.has(s.userId)) continue;
    const cur = latest.get(s.userId);
    if (!cur || s.endedAt > cur.endedAt) latest.set(s.userId, { userId: s.userId, subscriptionId: s.id, endedAt: s.endedAt });
  }
  return [...latest.values()];
}
