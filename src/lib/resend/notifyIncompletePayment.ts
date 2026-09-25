import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Envoyé quand un abonnement Stripe reste bloqué en statut 'incomplete'
// (première facture jamais confirmée : 3D Secure pas complété, carte
// refusée au premier essai...) OU 'past_due' (un renouvellement a échoué
// sur un abonnement déjà actif -- même cause possible côté banque, mais
// cette fois le client PERD un accès qu'il avait déjà) -- sans relance,
// la personne perd Premium en silence puisque isPremium() n'accepte ni
// l'un ni l'autre statut (voir src/lib/subscription/isPremium.ts). Le
// texte reste volontairement neutre entre "jamais activé" et "coupé au
// renouvellement" -- les deux mènent à la même action (repasser par
// /premium, qui affiche maintenant la bonne vue selon le cas, voir
// (app)/premium/page.tsx).
export async function notifyIncompletePayment(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Souci avec le paiement de ton abonnement Premium",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Le paiement de ton abonnement Premium sur Stageio n'a pas pu aboutir (ça arrive avec la validation bancaire type 3D Secure, une carte refusée ou expirée). Ton accès Premium est donc suspendu pour l'instant.</p>
<p>Tu peux mettre à jour ta carte et récupérer ton accès directement :</p>
<p><a href="${SITE_URL}/premium">Régler le problème de paiement</a></p>
<p>Un souci particulier avec le paiement ? Réponds directement à cet email, on t'aide.</p>
<p>À bientôt,<br />L'équipe Stageio</p>`,
  });
}
