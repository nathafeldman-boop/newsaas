import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Envoyé quand un abonnement Stripe reste bloqué en statut 'incomplete' :
// le client a lancé le paiement mais celui-ci n'a jamais abouti (3D Secure
// jamais confirmé, carte refusée au premier essai...) -- sans relance, la
// conversion reste perdue en silence puisque isPremium() ne considère
// jamais 'incomplete' comme Premium (voir src/lib/subscription/isPremium.ts)
// et rien ne prévient la personne que son passage Premium n'a pas marché.
export async function notifyIncompletePayment(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Ton passage Premium ne s'est pas terminé",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>On a vu que tu as commencé à passer Premium sur Stageio, mais le paiement n'a pas pu être finalisé (ça arrive avec la validation bancaire type 3D Secure, ou une carte refusée au premier essai). Ton compte n'a donc pas été débité et n'est pas encore Premium.</p>
<p>Si tu veux toujours débloquer les swipes illimités, les lettres de motivation générées par IA et l'audit CV, tu peux retenter directement :</p>
<p><a href="${SITE_URL}/premium">Finaliser mon passage Premium</a></p>
<p>Un souci particulier avec le paiement ? Réponds directement à cet email, on t'aide.</p>
<p>À bientôt,<br />L'équipe Stageio</p>`,
  });
}
