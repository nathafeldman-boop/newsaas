import { Type } from "@google/genai";
import { getGeminiClient, getGeminiModel, GEMINI_TIMEOUT_MS } from "@/lib/gemini/client";
import { buildProfileContextLines, type ProfileForAI } from "@/lib/gemini/profileContext";
import { cvAuditSchema, type CvAudit } from "@/lib/cvAudit/schema";

const SYSTEM_PROMPT = `Tu es un expert RH qui aide des étudiants et jeunes diplômés français à
préparer leur candidature à une alternance ou un stage. On te donne le texte brut extrait
d'un CV et le profil complet du candidat (secteurs visés, métiers visés, compétences,
formation, expérience, mobilité, disponibilité...). Évalue le CV et réponds UNIQUEMENT avec
un objet JSON valide, avec exactement ces champs :

{
  "score": number (0 à 100, note globale du CV pour candidater à une alternance/stage en France),
  "strengths": string[] (2 à 5 points forts concrets, en français),
  "improvements": string[] (3 à 6 axes d'amélioration concrets et actionnables, en français),
  "missing_sections": string[] (sections/informations importantes manquantes ou incomplètes, en français ; liste vide si rien à signaler)
}

Utilise le profil fourni pour évaluer et formuler CHAQUE point en fonction de la cible précise
du candidat (secteurs/métiers visés) plutôt qu'en langage générique -- ex: "Pour une
alternance en marketing digital, il manque une section projets avec des résultats chiffrés"
plutôt que "Il manque une section projets".

Sois bienveillant mais honnête et concret. Base la note sur : clarté de présentation,
pertinence du contenu pour la cible visée, mise en avant des compétences et projets,
structure, et absence de fautes ou d'incohérences évidentes. Ne mets jamais 100 si tu
identifies au moins une amélioration possible.`;

function buildUserPrompt(cvText: string, profile: ProfileForAI): string {
  const profileLines = buildProfileContextLines(profile);
  const contextBlock = profileLines.length > 0 ? `${profileLines.join("\n")}\n\n` : "";
  return `${contextBlock}Texte du CV :\n\n${cvText.slice(0, 15000)}`;
}

export async function auditCvWithGemini(cvText: string, profile: ProfileForAI): Promise<CvAudit> {
  const ai = getGeminiClient();
  const model = getGeminiModel();

  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(cvText, profile),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          missing_sections: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["score", "strengths", "improvements", "missing_sections"],
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

  return cvAuditSchema.parse(parsed);
}
