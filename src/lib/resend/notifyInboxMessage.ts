import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Prévient l'étudiant qu'un message est arrivé dans sa boîte Stageio (une
// réponse de recruteur se lit vite, sinon elle se perd). Le contenu du
// message reste dans l'appli : l'email ne reprend que l'expéditeur et l'objet.
export async function notifyInboxMessage(
  to: string,
  firstName: string | null,
  sender: string,
  subject: string | null,
  messageId: string,
) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const link = `${SITE_URL}/boite/${messageId}`;
  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to,
    subject: `Nouveau message de ${sender} dans ta boîte Stageio`,
    html: `<p>Salut${firstName ? ` ${escapeHtml(firstName)}` : ""},</p>
<p><strong>${escapeHtml(sender)}</strong> t'a écrit${subject ? ` : « ${escapeHtml(subject)} »` : ""}.</p>
<p><a href="${link}">Lire le message dans Stageio</a></p>
<p style="color:#5f7f87;font-size:13px">Tu reçois cet email parce qu'un message est arrivé sur ton adresse de candidature Stageio.</p>`,
  });
}
