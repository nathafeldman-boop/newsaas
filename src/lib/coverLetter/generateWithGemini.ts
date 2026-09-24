import { getGeminiClient, getGeminiModel, GEMINI_TIMEOUT_MS } from "@/lib/gemini/client";
import { buildProfileContextLines, type ProfileForAI } from "@/lib/gemini/profileContext";
import type { CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import type { Offer } from "@/types/database";

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

export async function generateCoverLetterWithGemini(
  offer: OfferInput,
  profile: ProfileForAI,
  cvText: string | null,
  extra?: CoverLetterExtra,
): Promise<string> {
  const ai = getGeminiClient();
  const model = getGeminiModel();

  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(offer, profile, cvText, extra),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.6,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini n'a pas renvoyé de lettre exploitable.");
  }
  return text;
}
