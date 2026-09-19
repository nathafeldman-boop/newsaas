import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Annonce ponctuelle (une fois par compte, voir weekly_offer_announced_at)
// du lancement de l'offre hebdomadaire (3,50€/semaine) auprès des inscrits
// déjà passés par le mur payant sans avoir pris Premium -- l'engagement
// mensuel était probablement le frein pour un besoin ponctuel (une
// candidature urgente), l'hebdo baisse cette barrière.
export async function notifyWeeklyOffer(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Nouveau sur Stageio : Premium à 3,50€ la semaine",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Tu as déjà utilisé tes swipes gratuits sur Stageio -- on vient d'ajouter une nouvelle façon de débloquer Premium, sans engagement mensuel : <strong>3,50€ pour une semaine</strong>.</p>
<p>De quoi passer en illimité (swipes, lettres de motivation générées par IA, audit de CV) pile pour une candidature urgente, sans t'engager sur le mois.</p>
<p><a href="${SITE_URL}/premium">Découvrir l'offre hebdomadaire</a></p>
<p>À bientôt,<br />L'équipe Stageio</p>`,
  });
}
