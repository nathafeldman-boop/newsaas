import { getResendClient } from "@/lib/resend/client";

// Filet de sécurité pour deleteAccountAction (profil/delete-account-actions.ts) :
// si l'annulation Stripe échoue pendant une suppression de compte, le
// compte (et donc stripe_customer_id/stripe_subscription_id) disparaît
// quand même juste après -- sans cette alerte, plus personne ne peut jamais
// retrouver cet abonnement pour l'annuler manuellement, et la carte
// continuerait d'être débitée indéfiniment. Un email (durable,
// indépendant de la base) plutôt qu'un simple console.error qui ne
// survit pas au compte supprimé.
export async function alertOrphanedStripeSubscription({
  userEmail,
  stripeSubscriptionId,
  errorMessage,
}: {
  userEmail: string | null;
  stripeSubscriptionId: string;
  errorMessage: string;
}) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) return;

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: adminEmails,
    subject: "⚠️ Abonnement Stripe orphelin après suppression de compte",
    html: `<p>L'annulation Stripe a échoué pendant la suppression d'un compte, qui a quand même été supprimé (droit à l'effacement RGPD) — cet abonnement continue probablement d'être facturé sans qu'aucun compte ne puisse plus le résilier lui-même.</p>
<p><strong>À annuler manuellement dans le dashboard Stripe :</strong></p>
<ul>
<li>Subscription ID : <code>${stripeSubscriptionId}</code></li>
<li>Email du compte supprimé : ${userEmail ?? "inconnu"}</li>
<li>Erreur : ${errorMessage}</li>
</ul>`,
  });
}
