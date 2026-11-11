import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditCheckoutPayment } from "@/lib/stripe/creditInvoicePayment";
import { paceFreeUntil, type UpsellKind } from "@/lib/pricing/creditPacks";

export const UPSELL_EVENT = "upsell_purchased";

export function upsellKind(session: Pick<Stripe.Checkout.Session, "metadata" | "mode">): UpsellKind | null {
  if (session.mode !== "payment") return null;
  const kind = session.metadata?.kind;
  return kind === "auto_credits" || kind === "pace_unlock" ? kind : null;
}

/**
 * Paiement de l'upsell « candidatures en plus » (voir startUpsellCheckout) :
 * crédite les candidatures ou lève la pause de 4 h, une seule fois par
 * session Stripe (le webhook peut être livré plusieurs fois). Ne touche ni
 * au statut d'abonnement ni à la formule.
 */
export async function applyUpsell(session: Stripe.Checkout.Session, kind: UpsellKind): Promise<{ ok: boolean }> {
  const userId = session.client_reference_id ?? session.metadata?.supabase_user_id ?? null;
  if (!userId || session.payment_status !== "paid") {
    console.error("applyUpsell: session sans compte ou non payée", { sessionId: session.id, userId, status: session.payment_status });
    return { ok: true };
  }
  const admin = createAdminClient();
  const { data: done } = await admin
    .from("user_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", UPSELL_EVENT)
    .contains("metadata", { sessionId: session.id })
    .limit(1)
    .maybeSingle();
  if (done) return { ok: true };

  const meta: Record<string, string | number | null> = { sessionId: session.id, kind, amountCents: session.amount_total ?? null };
  if (kind === "auto_credits") {
    const credits = Number(session.metadata?.credits ?? 0);
    if (!Number.isInteger(credits) || credits <= 0) {
      console.error("applyUpsell: nombre de crédits illisible", { sessionId: session.id, credits: session.metadata?.credits });
      return { ok: true };
    }
    const { data: balance, error } = await admin.rpc("add_auto_credits", { p_user: userId, p_credits: credits });
    if (error) {
      console.error("applyUpsell: crédits non ajoutés", error.message, { userId, sessionId: session.id });
      return { ok: false };
    }
    meta.credits = credits;
    meta.balance = balance ?? null;
  } else {
    const { data: profile } = await admin.from("profiles").select("auto_pace_free_until").eq("id", userId).maybeSingle();
    const until = paceFreeUntil(profile?.auto_pace_free_until ?? null, Date.now());
    const { error } = await admin.from("profiles").update({ auto_pace_free_until: until }).eq("id", userId);
    if (error) {
      console.error("applyUpsell: pause non levée", error.message, { userId, sessionId: session.id });
      return { ok: false };
    }
    meta.until = until;
  }

  await admin.from("user_events").insert({ user_id: userId, event_type: UPSELL_EVENT, metadata: meta });
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (customerId) {
    const { error } = await creditCheckoutPayment(session, customerId);
    if (error) console.error("applyUpsell: paiement non compté dans le total", error, { userId });
  }
  return { ok: true };
}
