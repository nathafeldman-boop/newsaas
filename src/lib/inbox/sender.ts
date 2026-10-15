// Expéditeur des emails envoyés au nom d'un étudiant (candidature par email,
// réponse depuis la boîte). Le plan gratuit de Resend ne vérifie qu'un
// domaine : l'email part de l'adresse d'envoi habituelle de Stageio
// (RESEND_FROM_EMAIL), au nom de l'étudiant, et la réponse va à son adresse
// Stageio (Reply-To), reçue gratuitement par Cloudflare (api/inbox/cloudflare).
export function studentSender(name: string | null, inboxAddress: string): { from: string; replyTo: string } {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const display = name ? `${name.replace(/[<>"]/g, "").trim()} via Stageio` : "Candidature via Stageio";
  return { from: `${display} <${fromEmail}>`, replyTo: inboxAddress };
}
