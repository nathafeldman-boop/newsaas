"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { verifyGoParams } from "@/lib/premium/goLink";
import { isGoCheckoutPlan } from "@/lib/premium/goOffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { startCheckout } from "@/lib/stripe/startCheckout";
import { SITE_URL } from "@/lib/site";

// Bouton de /paiement : ouvre la page de paiement Stripe du compte du lien
// signé, sans session. Signature revérifiée ici (le formulaire peut être
// rejoué à la main). Comme /premium/go, le prix est calculé avant
// d'enregistrer ce passage, qui ouvre ensuite le délai de l'offre.
export async function payFromEmailLinkAction(formData: FormData) {
  const field = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : null;
  };
  const plan = field("plan");
  const signed = { u: field("u"), e: field("e"), s: field("s") };
  const userId = verifyGoParams(signed);
  if (!isGoCheckoutPlan(plan) || !userId) redirect("/login?next=/premium");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) redirect("/login?next=/premium");

  const page = new URLSearchParams({ plan, u: signed.u!, e: signed.e!, s: signed.s! });
  const result = await startCheckout({ id: userId, email: data.user.email ?? null }, plan, {
    // Retour de Stripe sans payer : cette même page, prix à jour.
    guest: { cancelUrl: `${SITE_URL}/paiement?${page}&retour=1` },
  });
  if ("error" in result) redirect(`/paiement?${page}&error=${result.error}`);
  after(() => logServerEvent(admin, userId, "paywall_viewed", { source: "email_go_guest", plan }));
  redirect(result.url);
}
