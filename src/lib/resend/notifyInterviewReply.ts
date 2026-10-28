import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Réponse d'un recruteur rangée « entretien » (lib/inbox/receive.ts, 28/10) :
// au lieu du simple « nouveau message », un email qui le dit clairement et
// mène à la préparation (simulateur d'entretien du tableau de bord, réglé
// sur le métier de l'offre). Le contenu du message reste dans l'appli.
export async function notifyInterviewReply(params: {
  to: string;
  firstName: string | null;
  company: string;
  offerTitle: string | null;
  messageId: string;
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const read = `${SITE_URL}/boite/${params.messageId}`;
  const prep = `${SITE_URL}/dashboard?prep=${encodeURIComponent(params.offerTitle ?? params.company)}#simulateur`;
  const company = escapeHtml(params.company);
  await getResendClient().emails.send({
    from: `Stageio <${fromEmail}>`,
    to: params.to,
    subject: `🎉 ${params.company} veut te rencontrer : prépare ton entretien`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>Salut${params.firstName ? ` ${escapeHtml(params.firstName)}` : ""},</p>
<p><strong>${company}</strong> t'a répondu, et ça ressemble à une invitation à un entretien${params.offerTitle ? ` pour « ${escapeHtml(params.offerTitle)} »` : ""}. Bravo, c'est la plus grosse étape !</p>
<p><a href="${read}" style="display:inline-block;background:#0c7a44;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Lire sa réponse →</a></p>
<p style="margin-top:18px"><strong>Pour mettre toutes les chances de ton côté :</strong></p>
<p style="margin:0">1. Réponds vite (dans la journée) pour confirmer un créneau.<br>2. Regarde le site de ${company} : ce qu'ils font, leurs clients, leurs actualités.<br>3. Entraîne-toi aux questions classiques avec le simulateur d'entretien.<br>4. Prépare 2 questions à poser (missions, rythme école-entreprise, tuteur).</p>
<p><a href="${prep}" style="color:#0c7a44;font-weight:bold">M'entraîner avec le simulateur →</a></p>
<p>Bonne chance, on croise les doigts pour toi !<br>Nathan, de Stageio</p>
<p style="color:#5f7f87;font-size:13px">Tu reçois cet email parce qu'un recruteur a écrit sur ton adresse de candidature Stageio.</p>
</div>`,
  });
}
