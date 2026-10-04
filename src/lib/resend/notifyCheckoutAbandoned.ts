import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Relance pour un compte qui a cliqué sur un plan Premium (un client Stripe
// a été créé, voir getOrCreateStripeCustomer dans premium/actions.ts) mais
// n'a jamais terminé le paiement -- la session Stripe elle-même expire
// après 24h, donc on renvoie vers /premium pour recommencer plutôt que vers
// un lien de paiement qui ne marcherait plus. Jamais de remise/promo
// inventée ici : pas demandé, décision tarifaire qui revient à Nathan.
export async function notifyCheckoutAbandoned(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Tu n'as pas terminé ton passage Premium sur Stageio",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Tu as commencé à passer Premium sur Stageio mais le paiement n'a pas abouti -- ça arrive, rien n'a été débité.</p>
<p>Premium débloque : liker/mettre en favori, candidater sans limite, une lettre de motivation générée par IA pour chaque offre, et un audit de ton CV noté sur 100.</p>
<p><a href="${SITE_URL}/premium">Terminer mon passage Premium</a></p>
<p style="font-size:12px;color:#888">Un souci au moment de payer ? Réponds directement à cet email, on t'aide.</p>`,
  });
}
