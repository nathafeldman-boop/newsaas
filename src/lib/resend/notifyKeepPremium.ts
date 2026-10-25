import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Rappel à un abonné qui a résilié (25/10) : la date de fin, ce qu'il perd
// après, et un lien pour garder son Premium au même prix. Envoyé une seule
// fois par abonnement, depuis l'admin (« Abonnements et churn », filtre
// « Résiliation programmée ») : c'est Nathan qui déclenche l'envoi.
export async function notifyKeepPremium(email: string, fullName: string | null, endsOn: string, price: string) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: `Ton Premium s'arrête le ${endsOn}`,
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Tu as résilié ton abonnement Stageio Premium : il s'arrête le <strong>${endsOn}</strong>. D'ici là, tout reste ouvert.</p>
<p>Après cette date, tu repasses en gratuit : plus de likes ni de favoris, plus de candidatures illimitées, plus de lettres de motivation générées ni d'audit de ton CV.</p>
<p>Tu cherches encore ton alternance ? Tu peux garder ton Premium en un clic, au même prix (${price}), sans rien payer de plus aujourd'hui :</p>
<p><a href="${SITE_URL}/premium/garder">Garder mon Premium</a></p>
<p>Tu as trouvé, ou tu préfères arrêter ? Tu n'as rien à faire, ta résiliation reste prise en compte.</p>
<p>À bientôt,<br />L'équipe Stageio</p>`,
  });
  if (error) throw new Error(`notifyKeepPremium: ${error.message}`);
}
