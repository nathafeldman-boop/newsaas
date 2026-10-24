// Message de relance prêt à copier (24/10) : un modèle fixe rempli avec
// l'offre et le nom de l'étudiant, sans IA (aucun coût, aucune invention).
// Même ton que le guide /guides/relancer-candidature.

const CONTRACT_LABEL = { alternance: "en alternance", stage: "de stage" } as const;

export function followUpMessage(params: {
  title: string;
  company: string;
  contractType: "alternance" | "stage";
  sentAt: string | null;
  fullName: string | null;
}): { subject: string; body: string } {
  const sent = params.sentAt
    ? ` le ${new Date(params.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}`
    : "";
  const subject = `Relance : candidature ${CONTRACT_LABEL[params.contractType]} – ${params.title}`;
  const body = [
    "Bonjour,",
    "",
    `Je me permets de revenir vers vous au sujet de ma candidature au poste ${CONTRACT_LABEL[params.contractType]} « ${params.title} » chez ${params.company}, envoyée${sent}.`,
    "",
    "Ce poste m'intéresse toujours beaucoup et je reste disponible pour un échange, en visio ou en présentiel, à votre convenance. Je peux aussi vous transmettre tout document complémentaire.",
    "",
    "Je vous remercie par avance pour votre retour.",
    "",
    "Bien cordialement,",
    params.fullName?.trim() || "[Ton prénom et ton nom]",
  ].join("\n");
  return { subject, body };
}
