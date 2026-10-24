// Expéditeur des emails envoyés au nom d'un étudiant (candidature au like,
// réponse depuis la boîte). Depuis le 24/10 : directement depuis son adresse
// de candidature (prenom.nom.xxxx@INBOX_DOMAIN), le sous-domaine
// candidat.stageio.fr étant vérifié dans Resend. La réputation d'envoi des
// candidatures reste ainsi séparée de celle de stageio.fr (e-mails de compte
// et de relance). Reply-To identique : la réponse revient dans sa boîte.
export function studentSender(name: string | null, inboxAddress: string): { from: string; replyTo: string } {
  const display = (name ?? "").replace(/[<>"\r\n]/g, "").trim() || "Candidature";
  return { from: `${display} <${inboxAddress}>`, replyTo: inboxAddress };
}
