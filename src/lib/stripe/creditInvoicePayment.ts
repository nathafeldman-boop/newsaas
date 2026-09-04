import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Crédite un paiement (LTV/total_paid_cents) via la fonction SQL idempotente
 * credit_invoice_payment (voir la migration 20260904000002) : garde un
 * registre des factures déjà traitées, donc callable sans risque depuis
 * plusieurs endroits (webhook Stripe ET filet de secours de
 * /premium/success) -- une même facture ne peut jamais être comptée deux
 * fois, quel que soit l'ordre ou le nombre de fois où c'est appelé.
 */
export async function creditInvoicePayment(
  invoiceId: string,
  stripeCustomerId: string,
  amountCents: number,
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("credit_invoice_payment", {
    p_invoice_id: invoiceId,
    p_stripe_customer_id: stripeCustomerId,
    p_amount_cents: amountCents,
  });
  if (error) return { error: error.message };
  return {};
}
