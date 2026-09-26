import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// 50% sur mensuel et à vie (formule hebdomadaire retirée le 26/09, voir
// premium/actions.ts). Éligibilité décidée en comparant directement l'ID de
// Price Stripe de la facture aux mêmes variables d'env qui pilotent déjà le
// checkout (STRIPE_PRICE_ID / STRIPE_PRICE_ID_LIFETIME) -- plus fiable qu'un
// "recurring.interval", qui n'est de toute façon pas présent sur la ligne de
// facture sans expansion Stripe explicite côté webhook (et absent par
// nature sur un paiement unique). L'achat à vie génère une vraie Facture
// Stripe via invoice_creation (voir premium/actions.ts) : il arrive donc ici
// exactement comme n'importe quel renouvellement mensuel.
const COMMISSION_RATE = 0.5;

function planLabelForPriceId(priceId: string | null): "week" | "month" | "lifetime" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_WEEKLY?.trim()) return "week";
  if (priceId === process.env.STRIPE_PRICE_ID?.trim()) return "month";
  if (priceId === process.env.STRIPE_PRICE_ID_LIFETIME?.trim()) return "lifetime";
  return null;
}

/**
 * Appelée uniquement après un credit LTV réussi (voir le webhook
 * "invoice.paid") -- hérite donc gratuitement de la même protection contre
 * la course invoice.paid / checkout.session.completed (stripe_customer_id
 * pas encore posé sur le profil) : si creditInvoicePayment n'a pas matché
 * de profil, cette fonction n'est jamais appelée, et Stripe retentera le
 * même webhook plus tard.
 */
export async function creditAffiliateCommission(
  invoice: Stripe.Invoice,
  customerId: string,
): Promise<{ error?: string }> {
  const priceRef = invoice.lines.data[0]?.pricing?.price_details?.price;
  const priceId = typeof priceRef === "string" ? priceRef : (priceRef?.id ?? null);
  const planInterval = planLabelForPriceId(priceId);
  if (!planInterval) {
    // Jamais une erreur en soi (formule quotidienne, ou paiement hors
    // abonnement) -- mais sans ce log, impossible de distinguer après coup
    // "normal, pas éligible" de "STRIPE_PRICE_ID_WEEKLY/STRIPE_PRICE_ID ne
    // matche plus le vrai price Stripe" (ex: env var pas encore repropagée
    // juste après un changement de prix). Voir l'audit du 15/09.
    console.log("creditAffiliateCommission: plan non commissionnable, ignoré", {
      invoiceId: invoice.id,
      customerId,
      priceId,
    });
    return {};
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, affiliate_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };
  if (!profile?.affiliate_id) {
    // Idem : jamais une erreur (la personne n'est simplement pas venue via
    // un lien d'affiliation), mais sans log, un vrai bug d'attribution à
    // l'inscription (cookie aff_code perdu, code mal transmis...) serait
    // indiscernable d'un client venu par un autre canal.
    console.log("creditAffiliateCommission: profil sans affiliate_id, ignoré", {
      invoiceId: invoice.id,
      customerId,
      profileId: profile?.id ?? null,
    });
    return {};
  }

  const commissionCents = Math.round(invoice.amount_paid * COMMISSION_RATE);

  const { error } = await admin.from("affiliate_commissions").insert({
    affiliate_id: profile.affiliate_id,
    referred_user_id: profile.id,
    invoice_id: invoice.id,
    amount_paid_cents: invoice.amount_paid,
    commission_cents: commissionCents,
    plan_interval: planInterval,
  });
  // 23505 = violation de contrainte unique sur invoice_id : ce paiement a
  // déjà été commissionné (webhook rejoué) -- jamais une vraie erreur.
  if (error && error.code !== "23505") return { error: error.message };
  if (!error) {
    console.log("creditAffiliateCommission: commission créditée", {
      invoiceId: invoice.id,
      affiliateId: profile.affiliate_id,
      planInterval,
      commissionCents,
    });
  }
  return {};
}
