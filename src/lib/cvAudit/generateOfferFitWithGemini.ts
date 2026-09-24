import { Type } from "@google/genai";
import { getGeminiClient, getGeminiModel, GEMINI_TIMEOUT_MS } from "@/lib/gemini/client";
import { offerFitSchema, type OfferFit } from "@/lib/cvAudit/offerFitSchema";
import type { Offer } from "@/types/database";

const SYSTEM_PROMPT = `Tu es un expert RH qui aide un candidat français à savoir si son CV
correspond à UNE offre précise d'alternance ou de stage. On te donne le texte brut du CV et
le détail de l'offre (titre, entreprise, description, prérequis). Réponds UNIQUEMENT avec un
objet JSON valide, avec exactement ces champs :

{
  "score": number (0 à 100, à quel point ce CV correspond À CETTE offre précise, pas une note générale de CV),
  "matched": string[] (2 à 6 éléments concrets du CV qui correspondent aux prérequis de l'offre, en français),
  "gaps": string[] (0 à 6 prérequis de l'offre que le CV ne couvre pas ou peu, en français),
  "advice": string[] (1 à 4 conseils concrets et actionnables pour mieux coller à CETTE offre, en français)
}

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

export async function generateOfferFitWithGemini(cvText: string, offer: OfferInput): Promise<OfferFit> {
  const ai = getGeminiClient();
  const model = getGeminiModel();

  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(cvText, offer),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          matched: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          advice: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["score", "matched", "gaps", "advice"],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini n'a pas renvoyé de JSON exploitable.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini n'a pas renvoyé de JSON exploitable.");
  }

  return offerFitSchema.parse(parsed);
}
