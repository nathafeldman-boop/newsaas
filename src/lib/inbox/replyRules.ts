import type { EmailClassification } from "@/lib/google/classifyEmailReplyWithAnthropic";

// Classement d'une réponse de recruteur sans IA (30/10 : l'IA est coupée par
// défaut, crédit épuisé). Même forme que classifyEmailReply. Prudent : un
// refus ou une invitation n'est retenu que sur une formule claire ; dans le
// doute, « neutral » (le statut de la candidature ne bouge pas). Le refus
// passe avant l'invitation : « suite à notre entretien, nous avons le
// regret… » est un refus.

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ");

const REFUSAL = [
  /\b(?:pas|plus) (?:ete )?(?:retenue?s?|selectionnee?s?)\b/,
  /\b(?:pas|ne|n'|impossible de|plus)[^.!?]{0,40}\bdonner (?:une )?suite\b/,
  /\bpas de suite (?:favorable|positive)\b|\bsuite defavorable\b|\bsans suite\b/,
  /\bregret\b|\bregrett(?:ons|e|ons de)\b/,
  /\bmalheureusement\b[^.!?]{0,80}\b(?:candidature|profil|retenue?|suite|poste|pourvue?)\b/,
  /\b(?:a|ont) (?:deja )?ete pourvue?s?\b|\bdeja pourvue?s?\b/,
  /\b(?:retenu|choisi|privilegie|selectionne)[^.!?]{0,40}\b(?:une? autre|d'autres) (?:candidat|profil|candidature)/,
  /\bne correspond(?:ait|ent|aient)? pas\b/,
  /\bpas en mesure de (?:donner|retenir|vous proposer|poursuivre)\b/,
  /\bne (?:poursuivrons|donnerons) pas\b|\b(?:reponse|decision) negative\b/,
];

const INVITATION = [
  /\b(?:convier|conviee?|inviter|invitee?|convoquer|convoquee?|convocation)\b[^.!?]{0,80}\b(?:entretien|rencontre|echange|visio|rendez-vous|rdv|appel)\b/,
  /\b(?:fixer|planifier|programmer|caler|organiser|proposer|prevoir|convenir d')\s+(?:un|une|le|d'un|d'une)\s+(?:entretien|rendez-vous|rdv|appel|echange|visio|creneau|call)\b/,
  /\b(?:souhait\w*|aimeri\w*|voudri\w*|ravie?s?|plaisir|heureu\w*)\b[^.!?]{0,60}\b(?:rencontrer|echanger avec (?:vous|toi)|faire (?:votre |ta )?connaissance|s'entretenir|vous entretenir)\b/,
  /\btest technique\b|\bcas pratique\b/,
  /\bretenue? pour (?:un|une|la suite|le prochain|l'etape|la prochaine)\b/,
  /\bcandidature (?:a ete |est )retenue\b/,
  /\b(?:entretien|rendez-vous|rdv)\b[^.!?]{0,40}\b(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|demain|\d{1,2} ?h(?:\d\d)?|\d{1,2}\/\d{1,2})\b/,
];

const ASKS_AVAILABILITY = /\bdisponibilites?\b/;
const MEETING_WORD = /\b(?:entretien|echanger|echange|appel|rencontrer|rencontre|visio|telephonique)\b/;

const ACKNOWLEDGED = [
  /\bbien (?:recu|reception\w*) (?:votre|ta) candidature\b/,
  /\baccuse de reception\b/,
  /\b(?:nous )?(?:reviendrons|revenons) vers (?:vous|toi)\b/,
  /\b(?:etudions|etudierons|examinons|examinerons) (?:votre|ta) candidature\b/,
  /\bvotre candidature (?:a bien ete|est en cours)\b/,
];

const GENERIC_COMPANY_WORDS = new Set(["groupe", "societe", "entreprise", "cabinet", "agence", "france", "sas", "sarl", "les", "des"]);

function matchCompany(text: string, companies: string[]): string | null {
  for (const company of companies) {
    const name = fold(company).replace(/\b(?:sas|sasu|sarl|sa|eurl|sci)\b/g, "").trim();
    if (name.length >= 3 && text.includes(name)) return company;
    const word = name.split(/[^a-z0-9]+/).find((w) => w.length >= 4 && !GENERIC_COMPANY_WORDS.has(w));
    if (word && new RegExp(`\\b${word}\\b`).test(text)) return company;
  }
  return null;
}

export function classifyReplyByRules(
  email: { from: string | null; subject: string | null; snippet: string },
  candidateCompanies: string[],
  // Boîte Gmail (tous les e-mails de l'étudiant) : seulement si une
  // entreprise de ses candidatures est reconnue. La boîte Stageio, elle, a
  // déjà rattaché le message à une candidature par le domaine.
  opts: { requireCompany?: boolean } = {},
): EmailClassification {
  const text = fold(`${email.subject ?? ""}. ${email.snippet}`);
  const matched = matchCompany(fold(`${email.from ?? ""} ${email.subject ?? ""} ${email.snippet}`), candidateCompanies);

  let sentiment: EmailClassification["sentiment"] = null;
  if (REFUSAL.some((re) => re.test(text))) sentiment = "negative";
  else if (INVITATION.some((re) => re.test(text)) || (ASKS_AVAILABILITY.test(text) && MEETING_WORD.test(text))) sentiment = "positive";
  else if (ACKNOWLEDGED.some((re) => re.test(text))) sentiment = "neutral";

  if (opts.requireCompany && !matched) sentiment = null;
  return sentiment ? { is_recruiting_reply: true, matched_company: matched, sentiment } : { is_recruiting_reply: false, matched_company: null, sentiment: null };
}
