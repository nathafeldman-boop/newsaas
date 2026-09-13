import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Crédite un paiement (LTV/total_paid_cents) via la fonction SQL idempotente
 * credit_invoice_payment (voir la migration 20260913000000, qui a corrigé un
 * vrai bug de la version précédente -- 20260904000002 marquait une facture
 * comme traitée même quand aucun profil ne matchait encore le
 * stripe_customer_id, un cas réel quand "invoice.paid" arrive avant que
 * "checkout.session.completed" ait fini de poser ce champ) : garde un
 * registre des factures déjà créditées avec succès, donc callable sans
 * risque depuis plusieurs endroits (webhook Stripe ET filet de secours de
 * /premium/success) -- une même facture ne peut jamais être comptée deux
 * fois, quel que soit l'ordre ou le nombre de fois où c'est appelé.
 * `credited: false` signifie qu'aucun profil ne correspond encore à ce
 * stripe_customer_id -- l'appelant doit pouvoir réessayer plus tard, pas
 * traiter ça comme un succès silencieux.
 */
export async function creditInvoicePayment(
  invoiceId: string,
  stripeCustomerId: string,
  amountCents: number,
): Promise<{ credited: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("credit_invoice_payment", {
    p_invoice_id: invoiceId,
    p_stripe_customer_id: stripeCustomerId,
    p_amount_cents: amountCents,
  });
  if (error) return { credited: false, error: error.message };
  return { credited: data === true };
}
