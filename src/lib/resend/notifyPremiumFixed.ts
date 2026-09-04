import { getResendClient } from "@/lib/resend/client";

// Envoyé quand un compte a payé mais que l'activation Premium n'avait pas
// suivi (webhook Stripe jamais arrivé ou en échec, voir
// src/app/api/stripe/webhook/route.ts et src/app/(app)/premium/success) --
// un vrai incident client, pas une notification générique.
export async function notifyPremiumFixed(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "On a corrigé le souci — ton Premium est actif 🎉",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>On a eu un souci technique qui a empêché ton abonnement Premium de s'activer juste après ton paiement. C'est corrigé : ton compte est maintenant Premium (swipes illimités, audit CV illimité).</p>
<p>On est vraiment désolés pour la gêne occasionnée. Si quoi que ce soit ne fonctionne pas comme prévu, réponds directement à cet email, on s'en occupe immédiatement.</p>
<p>Merci pour ta confiance,<br />L'équipe Stageio</p>`,
  });
}
