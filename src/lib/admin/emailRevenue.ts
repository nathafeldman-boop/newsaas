import { DAY_MS, dayKey } from "@/lib/admin/trafficStats";

// Ce que rapporte chaque e-mail (25/10, Nathan : « l'email d'hier a ramené
// à peu près 40 € ») : chaque premier paiement (abonnement ou accès à vie,
// d'après Stripe) est rattaché au dernier e-mail de relance reçu par la même
// personne dans les 48 h qui précèdent, et compté au jour de cet e-mail.
// Un paiement sans e-mail dans ces 48 h n'est attribué à aucun. Pur et
// testable : les lectures sont dans le tableau de bord.

export const ATTRIBUTION_WINDOW_MS = 2 * DAY_MS;

export type EmailSend = { userId: string; at: number; source: string };
export type FirstPayment = { userId: string; at: number; cents: number };
export type SourceDay = { sent: number; payers: number; cents: number };
export type RevenueDay = { day: string; bySource: Record<string, SourceDay> };

export function attributeEmailRevenue(sends: EmailSend[], payments: FirstPayment[], sources: string[], days: string[], windowMs = ATTRIBUTION_WINDOW_MS): RevenueDay[] {
  const rows = new Map(days.map((day) => [day, { day, bySource: Object.fromEntries(sources.map((s) => [s, { sent: 0, payers: 0, cents: 0 }])) as Record<string, SourceDay> }]));
  const byUser = new Map<string, EmailSend[]>();
  for (const s of sends) {
    const row = rows.get(dayKey(s.at))?.bySource[s.source];
    if (row) row.sent++;
    const list = byUser.get(s.userId) ?? [];
    list.push(s);
    byUser.set(s.userId, list);
  }
  for (const p of payments) {
    let last: EmailSend | null = null;
    for (const s of byUser.get(p.userId) ?? []) {
      if (s.at <= p.at && p.at - s.at <= windowMs && (!last || s.at > last.at)) last = s;
    }
    if (!last) continue;
    const row = rows.get(dayKey(last.at))?.bySource[last.source];
    if (!row) continue;
    row.payers++;
    row.cents += p.cents;
  }
  return [...rows.values()];
}
