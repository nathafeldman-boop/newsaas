import type Stripe from "stripe";

// Paiement refusé = abonnement coupé (Nathan, 4/11 : « paiement refusé, pas
// récupérable, ils ont mis une fausse carte, ils n'ont plus d'argent : tu
// coupes leur abonnement »). Avant, Stripe retentait le prélèvement pendant
// des jours, l'abonnement restait en cours et l'admin parlait de « paiement
// refusé encore récupérable ».
//
// Quand : un RENOUVELLEMENT vient d'être refusé sur un abonnement déjà payé
// une première fois.
//
// Jamais pour un changement d'offre (Nathan, 4/11 : un abonné Premium qui veut
// passer à Stageio Auto et dont la carte est refusée GARDE son Premium ; seul
// celui qui renouvelle son mensuel et se fait refuser le perd). Le passage à
// l'Auto se fait en pending_if_incomplete (startCheckout.ts) : si le paiement
// échoue, rien ne change, l'abonnement reste actif au prix Premium avec un
// changement « en attente » (pending_update). Une première version de la règle
// (commit 869dda4, en ligne le 4/11 vers 10 h 37 UTC) coupait aussi ce cas.
//
// Le tout premier paiement (abonnement « incomplete ») n'est pas concerné non
// plus : il se règle sur la page de paiement Stripe, que la personne peut
// réessayer, et l'abonnement expire tout seul.
//
// Seuls restent « récupérables », sans rien couper, les refus que la personne
// règle elle-même ou qui passent seuls : demande d'authentification de la
// banque (3D Secure) et pannes techniques de la banque. Tout le reste (carte
// refusée, fonds insuffisants, carte expirée, perdue, volée, bloquée par
// Radar…) coupe l'abonnement tout de suite, sans prorata ni facture.

export const REFUSED_CUT_COMMENT = "Paiement refusé : abonnement coupé (carte refusée, non récupérable)";

const RECOVERABLE_CODES = new Set([
  "authentication_required",
  "authentication_not_handled",
  "payment_intent_authentication_failure",
  "processing_error",
  "issuer_not_available",
  "try_again_later",
  "reenter_transaction",
]);

type ChargeLike = Pick<Stripe.Charge, "failure_code" | "status"> & { outcome?: { type?: string | null } | null };

/** Refus définitif : carte refusée, fonds insuffisants, carte expirée ou bloquée par Radar. */
export function isUnrecoverableDecline(charge: ChargeLike): boolean {
  if (charge.status !== "failed") return false;
  if (charge.outcome?.type === "blocked") return true;
  const code = charge.failure_code ?? null;
  if (!code) return false;
  return !RECOVERABLE_CODES.has(code);
}

/**
 * Un abonnement dont le renouvellement vient d'être refusé : impayé. Un
 * abonnement encore actif avec un changement d'offre en attente
 * (pending_update : passage à l'Auto refusé) n'en est PAS un.
 */
export function looksRefused(subscription: Pick<Stripe.Subscription, "status">): boolean {
  return subscription.status === "past_due" || subscription.status === "unpaid";
}

export type RefusedResult =
  | { cut: true; chargeCode: string | null }
  | { cut: false; reason: "pas_un_refus" | "premier_paiement" | "changement_offre" | "refus_recuperable" | "aucun_refus_trouve" | "deja_arrete" };

type StripeLike = {
  invoices: { retrieve(id: string): Promise<Stripe.Invoice> };
  charges: { list(params: Stripe.ChargeListParams): Promise<{ data: ChargeLike[] }> };
  subscriptions: { cancel(id: string, params?: Stripe.SubscriptionCancelParams): Promise<unknown> };
};

/**
 * Coupe l'abonnement si son dernier paiement vient d'être refusé pour de bon.
 * Idempotent : un abonnement déjà arrêté ne fait rien. Lève seulement si
 * Stripe répond en erreur (le webhook peut alors être rejoué).
 */
export async function cutIfPaymentRefused(stripe: StripeLike, subscription: Stripe.Subscription): Promise<RefusedResult> {
  if (subscription.status === "canceled" || subscription.status === "incomplete_expired") return { cut: false, reason: "deja_arrete" };
  if (subscription.status === "incomplete") return { cut: false, reason: "premier_paiement" };
  if (!looksRefused(subscription)) return { cut: false, reason: "pas_un_refus" };

  const invoiceId = typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : (subscription.latest_invoice?.id ?? null);
  if (!invoiceId) return { cut: false, reason: "aucun_refus_trouve" };
  const invoice = await stripe.invoices.retrieve(invoiceId);
  // Changement d'offre (prorata du passage à l'Auto) : l'abonné garde son offre.
  if (invoice.billing_reason === "subscription_update") return { cut: false, reason: "changement_offre" };
  // Seule une facture de renouvellement encore impayée, déjà tentée, coupe.
  if (invoice.billing_reason !== "subscription_cycle") return { cut: false, reason: "premier_paiement" };
  if (invoice.status !== "open" || (invoice.attempt_count ?? 0) < 1) return { cut: false, reason: "pas_un_refus" };

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { data } = await stripe.charges.list({ customer: customerId, created: { gte: invoice.created - 600 }, limit: 10 });
  // Stripe renvoie les paiements du plus récent au plus ancien : le dernier refus fait foi.
  const lastFailed = data.find((c) => c.status === "failed");
  if (!lastFailed) return { cut: false, reason: "aucun_refus_trouve" };
  if (!isUnrecoverableDecline(lastFailed)) return { cut: false, reason: "refus_recuperable" };

  await stripe.subscriptions.cancel(subscription.id, {
    prorate: false,
    invoice_now: false,
    cancellation_details: { comment: REFUSED_CUT_COMMENT },
  });
  return { cut: true, chargeCode: lastFailed.failure_code ?? lastFailed.outcome?.type ?? null };
}

/** Abonnement arrêté par la règle ci-dessus : compté comme impayé définitif dans l'admin. */
export function isRefusedCut(comment: string | null | undefined): boolean {
  return typeof comment === "string" && comment.startsWith("Paiement refusé : abonnement coupé");
}
