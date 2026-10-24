// Cockpit admin (25/10, « transformer le dashboard en cockpit de pilotage
// SaaS ») : instantané normalisé des données Stripe de Stageio. Le compte
// Stripe est partagé avec d'autres projets : n'entrent ici que les objets
// rattachés à un compte Stageio (voir stripeSnapshot.ts). Dates en
// millisecondes, montants en centimes.

export type BillingInterval = "day" | "week" | "month" | "year";

export type SubRecord = {
  id: string;
  customer: string;
  userId: string | null;
  status: string;
  priceIds: string[];
  /** Montant facturé par période (toutes lignes, remises récurrentes déduites). */
  amountCents: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  /** Montant ramené au mois (voir monthlyAmount). */
  mrrCents: number;
  created: number;
  startDate: number;
  /** Ancre de facturation : les échéances tombent à anchor + k périodes. */
  anchor: number;
  canceledAt: number | null;
  endedAt: number | null;
  cancelAt: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  /** cancellation_requested, payment_failed, payment_disputed ou null. */
  cancelReason: string | null;
  /** Motif choisi dans le portail Stripe (too_expensive, unused…). */
  feedback: string | null;
  paused: boolean;
};

export type InvoiceRecord = {
  id: string;
  customer: string;
  subscription: string | null;
  /** subscription_create, subscription_cycle, manual (achat à vie)… */
  billingReason: string | null;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: number;
  paidAt: number | null;
  attemptCount: number;
};

export type OneTimeRecord = {
  id: string;
  customer: string | null;
  userId: string;
  amountCents: number;
  currency: string;
  created: number;
  invoice: string | null;
};

export type RefundRecord = {
  id: string;
  customer: string;
  amount: number;
  created: number;
};

export type DisputeRecord = {
  id: string;
  customer: string | null;
  amount: number;
  status: string;
  created: number;
};

export type StripeSnapshot = {
  computedAt: number;
  since: number;
  subs: SubRecord[];
  invoices: InvoiceRecord[];
  oneTime: OneTimeRecord[];
  refunds: RefundRecord[];
  disputes: DisputeRecord[];
  /** Abonnements Stageio dans une autre devise que l'euro (hors MRR). */
  otherCurrencySubs: number;
};
