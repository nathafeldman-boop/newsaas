import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Envoyé quand l'admin approuve une candidature au programme d'affiliation
// (voir src/app/admin/affiliates/actions.ts) -- révèle le lien à utiliser,
// jusque-là masqué tant que la candidature n'est pas validée.
export async function notifyAffiliateApproved(email: string, fullName: string | null, code: string) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Ta candidature affilié Stageio est approuvée 🎉",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Ta candidature au programme d'affiliation Stageio est approuvée ! Tu touches désormais <strong>50% de commission</strong> sur chaque abonnement mensuel (7,99€, à chaque renouvellement) ou accès à vie (70€, en une fois) que tu apportes.</p>
<p>Ton lien d'affiliation unique : <a href="${SITE_URL}/?aff=${code}">${SITE_URL}/?aff=${code}</a></p>
<p>Suis tes gains en temps réel depuis ton <a href="${SITE_URL}/affilies">tableau de bord affilié</a>.</p>
<p>Merci pour ta confiance,<br />L'équipe Stageio</p>`,
  });
}
