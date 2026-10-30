import { DAY_MS, type Range } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import { heardFromLabel } from "@/lib/onboarding/options";

// Revenu par canal (30/10, Nathan : « combien on a gagné grâce à chaque
// canal, TikTok commentaires, TikTok vidéo, Instagram vidéo […] un graphique
// journalier […] qu'on puisse faire un RPM »).
//
// Canal d'une personne : sa réponse à « Tu nous as connus comment ? »
// (onboarding, depuis le 20/10 ; format commentaire / vidéo / carrousel /
// story depuis le 25/10), sinon le lien par lequel elle est arrivée
// (utm_source), sinon « Non renseigné ». Chaque paiement Stripe (même relevé
// que le cockpit) compte pour le canal de la personne, le jour du paiement.
// RPM d'un jour = 1ers paiements du jour ÷ (vues du jour ÷ 1000), comme la
// page RPM (SOP 16 : jamais les renouvellements).

export type ChannelPayment = { at: number; cents: number; kind: "first" | "renewal"; customer: string | null; userId: string | null };
export type ChannelRefund = { at: number; cents: number; customer: string | null; userId: string | null };

/** Paiements encaissés (abonnements, accès à vie) et remboursements, reliés à un compte quand c'est possible. */
export function channelPayments(snap: StripeSnapshot): { payments: ChannelPayment[]; refunds: ChannelRefund[] } {
  const userByCustomer = new Map<string, string>();
  for (const s of snap.subs) if (s.userId && s.customer) userByCustomer.set(s.customer, s.userId);
  for (const o of snap.oneTime) if (o.customer) userByCustomer.set(o.customer, o.userId);
  const subUser = new Map(snap.subs.map((s) => [s.id, s.userId]));

  const payments: ChannelPayment[] = [];
  for (const inv of snap.invoices) {
    if (!inv.subscription || inv.status !== "paid" || inv.amountPaid <= 0) continue;
    payments.push({
      at: inv.paidAt ?? inv.created,
      cents: inv.amountPaid,
      // Même règle que la page Revenus.
      kind: inv.billingReason === "subscription_cycle" ? "renewal" : "first",
      customer: inv.customer || null,
      userId: subUser.get(inv.subscription) ?? userByCustomer.get(inv.customer) ?? null,
    });
  }
  // Accès à vie : la session (sa facture n'est pas rattachée à un abonnement),
  // plus les factures d'achat unique sans session reliée (compte supprimé).
  const sessionInvoices = new Set(snap.oneTime.map((o) => o.invoice).filter(Boolean));
  for (const o of snap.oneTime) payments.push({ at: o.created, cents: o.amountCents, kind: "first", customer: o.customer, userId: o.userId });
  for (const inv of snap.invoices) {
    if (inv.subscription || inv.status !== "paid" || inv.amountPaid <= 0 || sessionInvoices.has(inv.id)) continue;
    payments.push({ at: inv.paidAt ?? inv.created, cents: inv.amountPaid, kind: "first", customer: inv.customer || null, userId: userByCustomer.get(inv.customer) ?? null });
  }
  const refunds = snap.refunds.map((r) => ({ at: r.created, cents: r.amount, customer: r.customer || null, userId: userByCustomer.get(r.customer) ?? null }));
  return { payments, refunds };
}

export const UNKNOWN_CHANNEL = "Non renseigné";

/** « TikTok · commentaire », sinon « Lien tiktok » (arrivé par un lien, sans réponse), sinon « Non renseigné ». */
export function channelLabel(heard: { source: string; format: string | null } | null | undefined, utmSource: string | null | undefined): string {
  if (heard?.source) return heardFromLabel(heard.source, heard.format);
  const utm = utmSource?.trim();
  return utm ? `Lien ${utm.toLowerCase()}` : UNKNOWN_CHANNEL;
}

export type ChannelDay = { t: number; firstCents: number; renewalCents: number; signups: number; payers: number; views: number | null };

export type ChannelRow = {
  channel: string;
  revenueCents: number;
  firstCents: number;
  renewalCents: number;
  refundedCents: number;
  /** Comptes qui ont payé pour la 1re fois sur la période. */
  newPayers: number;
  signups: number;
  /** Vues saisies sur la période, et 1ers paiements des mêmes jours (pour le RPM). */
  views: number;
  firstCentsOnViewDays: number;
  days: ChannelDay[];
};

/** RPM : euros (en centimes) pour 1000 vues ; null sans vues. */
export function rpmCents(firstCents: number, views: number | null): number | null {
  return views && views > 0 ? Math.round((firstCents * 1000) / views) : null;
}

export function buildChannelReport(params: {
  range: Range;
  payments: ChannelPayment[];
  refunds: ChannelRefund[];
  /** Canal de chaque compte connu (payeurs et inscrits). */
  channelByUser: Map<string, string>;
  signups: { userId: string; at: number }[];
  views: { day: string; channel: string; views: number }[];
  /** Jour « AAAA-MM-JJ » (heure de Paris) d'un instant. */
  dayKey: (t: number) => string;
}): ChannelRow[] {
  const { range, payments, refunds, channelByUser, signups, views, dayKey } = params;
  const n = Math.max(0, Math.round((range.end - range.start) / DAY_MS));
  const times = Array.from({ length: n }, (_, i) => range.start + i * DAY_MS);
  const keyIndex = new Map(times.map((t, i) => [dayKey(t + DAY_MS / 2), i]));
  const indexOf = (t: number) => (t >= range.start && t < range.end ? Math.min(n - 1, Math.floor((t - range.start) / DAY_MS)) : -1);
  const channelOf = (userId: string | null) => (userId ? (channelByUser.get(userId) ?? UNKNOWN_CHANNEL) : UNKNOWN_CHANNEL);

  const rows = new Map<string, ChannelRow>();
  const row = (channel: string) => {
    let r = rows.get(channel);
    if (!r) {
      r = {
        channel,
        revenueCents: 0,
        firstCents: 0,
        renewalCents: 0,
        refundedCents: 0,
        newPayers: 0,
        signups: 0,
        views: 0,
        firstCentsOnViewDays: 0,
        days: times.map((t) => ({ t, firstCents: 0, renewalCents: 0, signups: 0, payers: 0, views: null })),
      };
      rows.set(channel, r);
    }
    return r;
  };

  // 1er paiement d'un compte (ou d'un client Stripe sans compte) : le plus ancien, toutes périodes confondues.
  const firstAt = new Map<string, number>();
  for (const p of payments) {
    const id = p.userId ?? p.customer;
    if (id && (!firstAt.has(id) || p.at < firstAt.get(id)!)) firstAt.set(id, p.at);
  }

  for (const p of payments) {
    const i = indexOf(p.at);
    if (i < 0) continue;
    const r = row(channelOf(p.userId));
    const d = r.days[i];
    if (p.kind === "first") {
      r.firstCents += p.cents;
      d.firstCents += p.cents;
    } else {
      r.renewalCents += p.cents;
      d.renewalCents += p.cents;
    }
    r.revenueCents += p.cents;
    const id = p.userId ?? p.customer;
    if (id && firstAt.get(id) === p.at) {
      r.newPayers += 1;
      d.payers += 1;
    }
  }
  for (const x of refunds) {
    if (indexOf(x.at) < 0) continue;
    row(channelOf(x.userId)).refundedCents += x.cents;
  }
  for (const s of signups) {
    const i = indexOf(s.at);
    if (i < 0) continue;
    const r = row(channelOf(s.userId));
    r.signups += 1;
    r.days[i].signups += 1;
  }
  for (const v of views) {
    const i = keyIndex.get(v.day);
    if (i === undefined) continue;
    const r = row(v.channel);
    r.days[i].views = (r.days[i].views ?? 0) + v.views;
    r.views += v.views;
  }
  for (const r of rows.values()) r.firstCentsOnViewDays = r.days.reduce((s, d) => s + (d.views ? d.firstCents : 0), 0);

  return [...rows.values()].sort((a, b) => b.revenueCents - a.revenueCents || b.signups - a.signups || a.channel.localeCompare(b.channel, "fr"));
}
