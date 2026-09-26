import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getAnthropicModel, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";
import { offerFitSchema, type OfferFit } from "@/lib/cvAudit/offerFitSchema";
import type { Offer } from "@/types/database";

const SYSTEM_PROMPT = `Tu es un expert RH qui aide un candidat français à savoir si son CV
correspond à UNE offre précise d'alternance ou de stage. On te donne le texte brut du CV et
le détail de l'offre (titre, entreprise, description, prérequis). Renvoie ta réponse en
respectant le format demandé :

- score : à quel point ce CV correspond À CETTE offre précise (0 à 100), pas une note générale de CV.
- matched : 2 à 6 éléments concrets du CV qui correspondent aux prérequis de l'offre, en français.
- gaps : 0 à 6 prérequis de l'offre que le CV ne couvre pas ou peu, en français.
- advice : 1 à 4 conseils concrets et actionnables pour mieux coller à CETTE offre, en français.

N'invente jamais un élément du CV qui n'y figure pas, et ne mentionne jamais un prérequis qui
ne figure pas explicitement dans l'offre. Si le CV correspond déjà bien, "gaps" peut être vide
-- ne force jamais une lacune artificielle. Sois concret et bref, jamais générique.`;

type OfferInput = Pick<Offer, "title" | "company" | "description" | "requirements">;

function buildUserPrompt(cvText: string, offer: OfferInput): string {
  const lines = [
    `Offre : ${offer.title} chez ${offer.company}.`,
    `Description : ${offer.description.slice(0, 1500)}`,
  ];
  if (offer.requirements) {
    lines.push(`Prérequis/profil recherché : ${offer.requirements.slice(0, 800)}`);
  }
  lines.push(`Texte du CV du candidat :\n${cvText.slice(0, 10000)}`);
  return lines.join("\n");
}

export async function generateOfferFitWithAnthropic(cvText: string, offer: OfferInput): Promise<OfferFit> {
  const client = getAnthropicClient();
  const model = getAnthropicModel();

  const response = await client.messages.parse(
    {
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      temperature: 0.2,
      messages: [{ role: "user", content: buildUserPrompt(cvText, offer) }],
      output_config: { format: zodOutputFormat(offerFitSchema) },
    },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  if (!response.parsed_output) {
    throw new Error("Claude n'a pas renvoyé de JSON exploitable.");
  }

  return response.parsed_output;
}
