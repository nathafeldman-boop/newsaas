import type Stripe from "stripe";
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

// Achat à vie (checkout en mode "payment") : aucune facture Stripe, donc
// rien ne passait par invoice.paid -- le paiement est crédité sous l'id du
// PaymentIntent, dans le même registre idempotent que les factures.
export async function creditCheckoutPayment(
  session: Stripe.Checkout.Session,
  customerId: string,
): Promise<{ credited: boolean; error?: string }> {
  const amount = session.amount_total ?? 0;
  if (session.mode !== "payment" || session.payment_status !== "paid" || amount <= 0) return { credited: false };
  const key =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? session.id);
  return creditInvoicePayment(key, customerId, amount);
}
