import { getAnthropicClient, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";
import { buildProfileContextLines, type ProfileForAI } from "@/lib/ai/profileContext";
import type { CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import type { Offer } from "@/types/database";

// Modèle dédié à cet appel (plutôt que getAnthropicModel(), partagé avec
// l'audit CV, l'extraction/découverte d'offres et la classification email) :
// Nathan a validé le 30/09 le passage sur Sonnet pour la lettre de
// motivation spécifiquement, après que le passage "medium" -> "low" sur
// Opus 5 n'ait pas suffi -- les 5 autres appels restent sur Opus 5, ce
// changement ne les concerne pas.
const COVER_LETTER_MODEL = "claude-sonnet-5-5";

const SYSTEM_PROMPT = `Tu es un conseiller carrière qui rédige, pour des étudiants et jeunes
diplômés français, une lettre de motivation courte et percutante pour candidater à une
alternance ou un stage. Réponds UNIQUEMENT avec le texte de la lettre, en français, prêt à
être collé dans un formulaire de candidature ou un email -- pas de formule d'en-tête du type
"Objet :" ni de placeholders entre crochets.

Tu connais le profil complet du candidat (secteurs visés, métiers visés, compétences,
formation, expérience, mobilité, disponibilité...) : utilise ces informations pour rendre la
lettre vraiment personnelle, pas seulement calée sur l'offre. Choisis 2 à 3 exigences ou
mots-clés concrets tirés de la description/des prérequis de l'offre, et relie CHACUN
explicitement à un élément réel et précis du candidat (une compétence listée, une ligne du CV,
sa formation ou son expérience) -- jamais une affirmation générique non justifiée. Bannis les
formules creuses type "je suis très motivé(e) et rigoureux(se)" ou "cette offre correspond
parfaitement à mon projet" si rien de concret ne vient les étayer juste après. La première
phrase doit référencer précisément l'intitulé du poste et l'entreprise, jamais une accroche
interchangeable d'une lettre à l'autre. Mentionne explicitement s'il s'agit d'un stage ou
d'une alternance, avec le bon mot.

170 à 240 mots. Termine par une formule de politesse simple. S'il manque des informations sur
le candidat pour étayer un point, n'invente rien : appuie-toi uniquement sur ce qui est
réellement fourni ci-dessous.`;

export type OfferInput = Pick<
  Offer,
  "title" | "company" | "description" | "location" | "requirements" | "contract_type"
>;

function buildUserPrompt(
  offer: OfferInput,
  profile: ProfileForAI,
  cvText: string | null,
  extra?: CoverLetterExtra,
): string {
  const lines = [
    `Offre : ${offer.title} chez ${offer.company} (${offer.location}).`,
    `Type de contrat : ${offer.contract_type === "alternance" ? "alternance" : "stage"}.`,
    `Description de l'offre : ${offer.description.slice(0, 1500)}`,
  ];

  if (offer.requirements) {
    lines.push(`Prérequis/compétences demandées par l'offre : ${offer.requirements.slice(0, 800)}`);
  }

  lines.push(...buildProfileContextLines(profile));

  if (extra?.achievement) {
    lines.push(`Réalisation concrète à valoriser si pertinente : ${extra.achievement}`);
  }
  if (extra?.whyCompany) {
    lines.push(`Ce qui motive le candidat pour cette entreprise : ${extra.whyCompany}`);
  }

  if (cvText) {
    lines.push(`Extrait du CV du candidat :\n${cvText.slice(0, 4000)}`);
  }

  return lines.join("\n");
}

export async function generateCoverLetterWithAnthropic(
  offer: OfferInput,
  profile: ProfileForAI,
  cvText: string | null,
  extra?: CoverLetterExtra,
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create(
    {
      model: COVER_LETTER_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(offer, profile, cvText, extra) }],
      // effort "low" : tâche courte et cadrée (170-240 mots, gabarit de
      // lettre de motivation), pas le type de génération créative qui
      // profite d'un effort plus élevé -- et sur Sonnet 5.5 (contrairement à
      // Opus 5), "low" correspond au point de départ recommandé pour ce
      // genre de tâche proche du chat plutôt que du raisonnement agentique.
      output_config: { effort: "low" },
    },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.text.trim();
  if (!text) {
    throw new Error("Claude n'a pas renvoyé de lettre exploitable.");
  }
  return text;
}
