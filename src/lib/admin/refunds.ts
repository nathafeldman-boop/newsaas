import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

// Onglet « Remboursements » (30/10, Nathan : « crée un onglet
// remboursement »). Les demandes arrivent par trois canaux lisibles par
// l'app : le commentaire laissé en résiliant dans le portail Stripe, le
// questionnaire de départ (subscription_cancellations) et le formulaire de
// la garantie (événement refund_requested). Les e-mails envoyés à
// contact@stageio.fr n'arrivent pas ici. Le remboursement se fait à la main
// dans Stripe : une demande passe en « remboursé » dès qu'un remboursement
// Stripe existe pour ce client après la demande. Fonctions pures.

const DAY = 86_400_000;
/** Délai de rétractation (Code de la consommation), compté depuis le 1er paiement. */
export const WITHDRAWAL_DAYS = 14;

export type RefundSource = "stripe" | "questionnaire" | "garantie";

export const SOURCE_LABELS: Record<RefundSource, string> = {
  stripe: "Résiliation Stripe",
  questionnaire: "Questionnaire de départ",
  garantie: "Garantie",
};

/** Le texte parle d'un remboursement (« rembourser », « remboursé », « refund », « mon argent »). */
export function mentionsRefund(text: string | null | undefined): boolean {
  return !!text && /rembours|refund|mon argent|r[ée]cup[ée]rer (mon|mes) (argent|sous)/i.test(text);
}

export type RawRefundRequest = { source: RefundSource; at: number; userId: string | null; customer: string | null; text: string | null };

export type RefundRequest = RawRefundRequest & {
  /** Encaissé auprès de ce client (factures payées et achats à vie), en centimes. */
  paidCents: number;
  firstPaidAt: number | null;
  /** Jours entre le 1er paiement et la demande. */
  daysAfterFirstPayment: number | null;
  withinWithdrawal: boolean;
  refundedCents: number;
  refundedAt: number | null;
};

type CustomerPayments = { paidCents: number; firstPaidAt: number | null };

/** Encaissé par client Stripe : factures payées, plus les achats à vie sans facture. */
export function paymentsByCustomer(snap: StripeSnapshot): Map<string, CustomerPayments> {
  const out = new Map<string, CustomerPayments>();
  const add = (customer: string | null, cents: number, at: number) => {
    if (!customer || cents <= 0) return;
    const prev = out.get(customer) ?? { paidCents: 0, firstPaidAt: null };
    out.set(customer, { paidCents: prev.paidCents + cents, firstPaidAt: prev.firstPaidAt === null ? at : Math.min(prev.firstPaidAt, at) });
  };
  const invoiced = new Set(snap.invoices.map((i) => i.id));
  for (const i of snap.invoices) if (i.status === "paid") add(i.customer, i.amountPaid, i.paidAt ?? i.created);
  for (const o of snap.oneTime) if (!(o.invoice && invoiced.has(o.invoice))) add(o.customer, o.amountCents, o.created);
  return out;
}

/** Compte Stageio → client Stripe, et l'inverse (abonnements et achats à vie). */
export function customerLinks(snap: StripeSnapshot) {
  const byUser = new Map<string, string>();
  const byCustomer = new Map<string, string>();
  for (const s of [...snap.subs].sort((a, b) => a.created - b.created)) {
    if (!s.userId) continue;
    byUser.set(s.userId, s.customer);
    byCustomer.set(s.customer, s.userId);
  }
  for (const o of snap.oneTime) {
    if (!o.customer) continue;
    if (!byUser.has(o.userId)) byUser.set(o.userId, o.customer);
    if (!byCustomer.has(o.customer)) byCustomer.set(o.customer, o.userId);
  }
  return { byUser, byCustomer };
}

/** Commentaires de résiliation Stripe qui demandent un remboursement. */
export function stripeRefundComments(snap: StripeSnapshot): RawRefundRequest[] {
  return snap.subs
    .filter((s) => s.canceledAt !== null && mentionsRefund(s.cancelComment))
    .map((s) => ({ source: "stripe" as const, at: s.canceledAt!, userId: s.userId, customer: s.customer, text: s.cancelComment ?? null }));
}

/** Complète chaque demande (paiements, délai, remboursement fait) ; à traiter d'abord, puis les plus récentes. */
export function buildRefundRequests(raw: RawRefundRequest[], snap: StripeSnapshot): RefundRequest[] {
  const payments = paymentsByCustomer(snap);
  const { byUser, byCustomer } = customerLinks(snap);
  const seen = new Set<string>();
  const out: RefundRequest[] = [];
  for (const r of raw) {
    const customer = r.customer ?? (r.userId ? (byUser.get(r.userId) ?? null) : null);
    const userId = r.userId ?? (customer ? (byCustomer.get(customer) ?? null) : null);
    const key = `${r.source}|${userId ?? customer}|${r.at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const pay = customer ? payments.get(customer) : undefined;
    const firstPaidAt = pay?.firstPaidAt ?? null;
    const daysAfterFirstPayment = firstPaidAt === null ? null : Math.max(0, Math.floor((r.at - firstPaidAt) / DAY));
    // Un remboursement fait la veille de la demande compte aussi (demande saisie après coup).
    const refunds = customer ? snap.refunds.filter((x) => x.customer === customer && x.created >= r.at - DAY) : [];
    out.push({
      ...r,
      customer,
      userId,
      paidCents: pay?.paidCents ?? 0,
      firstPaidAt,
      daysAfterFirstPayment,
      withinWithdrawal: daysAfterFirstPayment !== null && daysAfterFirstPayment < WITHDRAWAL_DAYS,
      refundedCents: refunds.reduce((sum, x) => sum + x.amount, 0),
      refundedAt: refunds.length > 0 ? Math.min(...refunds.map((x) => x.created)) : null,
    });
  }
  return out.sort((a, b) => Number(a.refundedCents > 0) - Number(b.refundedCents > 0) || b.at - a.at);
}

/** Personnes (compte ou client Stripe) avec au moins une demande sans remboursement fait depuis. */
export function pendingPeople(requests: RefundRequest[]): { total: number; withinWithdrawal: number } {
  const pending = new Map<string, boolean>();
  for (const r of requests) {
    if (r.refundedCents > 0) continue;
    const key = r.userId ?? r.customer ?? `${r.source}-${r.at}`;
    pending.set(key, (pending.get(key) ?? false) || r.withinWithdrawal);
  }
  return { total: pending.size, withinWithdrawal: [...pending.values()].filter(Boolean).length };
}
