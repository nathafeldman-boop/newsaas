import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";

// Relance ponctuelle (une fois par compte, voir swipe_relance_sent_at)
// pour les inscrits qui ont déjà swipé au moins une offre mais ne sont
// pas revenus depuis -- contrairement à notifyNoSwipe (jamais swipé du
// tout), ici la personne connaît déjà le principe de l'app.
export async function notifySwipeRelance(email: string, fullName: string | null, profileId: string) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "De nouvelles offres t'attendent sur Stageio",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Ça fait un moment qu'on ne t'a pas vu·e sur Stageio -- plein de nouvelles offres d'alternance et de stage sont arrivées depuis ton dernier passage. Ça vaut le coup d'aller y jeter un œil, ça prend 30 secondes.</p>
<p><a href="${SITE_URL}/swipe">Voir les nouvelles offres</a></p>
${unsubscribeFooterHtml(profileId)}`,
    headers: unsubscribeHeaders(profileId),
  });
}
