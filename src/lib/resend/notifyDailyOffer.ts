import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Annonce ponctuelle (une fois par compte, voir daily_offer_announced_at) du
// lancement de l'offre quotidienne (1,50€/jour) à TOUS les inscrits -- contrairement
// à notifyWeeklyOffer (réservé à ceux ayant épuisé leurs swipes gratuits), celle-ci
// vise large : demande explicite de prévenir tout le monde de ce nouveau palier
// d'entrée, même les comptes qui n'ont jamais touché au mur payant.
export async function notifyDailyOffer(email: string, fullName: string | null) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Nouveau sur Stageio : Premium à 1,50€ la journée",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>On vient d'ajouter une nouvelle façon de débloquer Premium sur Stageio : <strong>1,50€ pour une journée</strong>.</p>
<p>De quoi passer en illimité (swipes, lettres de motivation générées, audit de CV) pile le temps de traiter une urgence -- une offre qui vient de tomber, une candidature à boucler ce soir -- sans t'engager sur la semaine ou le mois.</p>
<p><a href="${SITE_URL}/premium">Découvrir l'offre à la journée</a></p>
<p>À bientôt,<br />L'équipe Stageio</p>`,
  });
}
