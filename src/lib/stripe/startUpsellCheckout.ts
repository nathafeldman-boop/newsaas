import { getStripeClient } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/stripe/startCheckout";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { isPremium } from "@/lib/subscription/isPremium";
import { euros, findCreditPack, PACE_UNLOCK, type UpsellKind } from "@/lib/pricing/creditPacks";

// Paiement unique de l'upsell « candidatures en plus » (11/11) : pack de
// candidatures automatiques, ou levée de la pause de 4 h pendant 24 h.
// Réservé aux comptes Premium (Premium simple ou Auto). Le webhook Stripe
// reconnaît la session à metadata.kind et crédite le compte (voir
// lib/stripe/applyUpsell.ts) ; jamais traitée comme un achat « à vie ».

export type UpsellError = "premium_required" | "unknown_pack" | "checkout_failed";

export const UPSELL_PAGE = "/premium/candidatures";

export async function startUpsellCheckout(
  user: { id: string; email: string | null },
  kind: unknown,
  packId: unknown,
): Promise<{ url: string } | { error: UpsellError }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .maybeSingle();
  if (!isPremium(profile)) return { error: "premium_required" };

  let line: { name: string; cents: number };
  let metadata: Record<string, string>;
  if (kind === "pace_unlock") {
    line = { name: `Envoi automatique sans pause pendant ${PACE_UNLOCK.hours} h`, cents: PACE_UNLOCK.cents };
    metadata = { kind: "pace_unlock" satisfies UpsellKind, supabase_user_id: user.id, hours: String(PACE_UNLOCK.hours) };
  } else {
    const pack = findCreditPack(packId);
    if (!pack) return { error: "unknown_pack" };
    line = { name: `${pack.credits.toLocaleString("fr-FR")} candidatures automatiques en plus`, cents: pack.cents };
    metadata = { kind: "auto_credits" satisfies UpsellKind, supabase_user_id: user.id, pack: pack.id, credits: String(pack.credits) };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email, supabase);
    const session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: { currency: "eur", unit_amount: line.cents, product_data: { name: `Stageio : ${line.name}` } },
        },
      ],
      client_reference_id: user.id,
      metadata,
      payment_intent_data: { metadata },
      invoice_creation: { enabled: true },
      success_url: `${SITE_URL}${UPSELL_PAGE}?ok=1`,
      cancel_url: `${SITE_URL}${UPSELL_PAGE}?retour=paiement`,
    });
    if (!session.url) return { error: "checkout_failed" };
    await createAdminClient()
      .from("user_events")
      .insert({ user_id: user.id, event_type: "upsell_checkout_opened", metadata: { ...metadata, amount: euros(line.cents) } });
    return { url: session.url };
  } catch (err) {
    console.error("startUpsellCheckout: session Stripe en échec", err instanceof Error ? err.message : err, { userId: user.id });
    return { error: "checkout_failed" };
  }
}
