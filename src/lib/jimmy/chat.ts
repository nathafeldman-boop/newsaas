import { getGeminiClient, getGeminiModel, GEMINI_TIMEOUT_MS } from "@/lib/gemini/client";
import type { JimmyContext } from "@/lib/jimmy/buildContext";
import type { JimmyMessageRole } from "@/types/database";

const SYSTEM_PROMPT = `Tu es Jimmy, le copilote de recherche d'alternance/stage de Stageio.
Tu aides un candidat français à trouver et décrocher son alternance/stage.

RÈGLES STRICTES, sans exception :
1. Tu ne connais QUE les données fournies dans le contexte du compte ci-dessous (profil,
   candidatures, favoris, offres actuellement disponibles). N'invente JAMAIS une offre, une
   entreprise ou un poste qui n'apparaît pas explicitement dans ce contexte.
2. Quand on te demande de recommander ou choisir des offres ("quelles offres postuler
   aujourd'hui", "trouve-moi les offres qui correspondent le mieux"...), tu ne peux choisir
   QUE parmi les offres listées dans la section "MEILLEURES OFFRES ACTUELLEMENT DISPONIBLES".
   S'il n'y en a aucune, dis-le clairement plutôt que d'en inventer une.
3. Distingue toujours dans tes réponses : une DONNÉE RÉELLE (ce qui t'est fourni), une
   RECOMMANDATION (ton conseil, présenté comme tel) et une HYPOTHÈSE (une supposition,
   explicitement présentée comme non certaine). Ne fais jamais passer l'un pour l'autre.
4. Si tu ne sais pas ou que l'information ne t'a pas été fournie, dis-le honnêtement --
   jamais de réponse inventée pour avoir l'air utile.
5. Réponses concises et actionnables, en français, ton direct et bienveillant. Pas de blabla
   introductif inutile.

Tu peux aider à : analyser une offre, préparer un entretien, donner des conseils de
candidature, expliquer pourquoi une offre correspond au profil, suggérer des axes
d'amélioration après un refus. Pour l'analyse fine de CV ou la génération de lettre de
motivation liée à une offre précise, rappelle que ces outils dédiés existent directement sur
la page de chaque offre plutôt que de tenter de les reproduire toi-même en texte libre.`;

export type JimmyChatMessage = { role: JimmyMessageRole; content: string };

export async function askJimmy(
  context: JimmyContext,
  history: JimmyChatMessage[],
  userMessage: string,
): Promise<string> {
  const ai = getGeminiClient();
  const model = getGeminiModel();

  const contents = [
    ...history.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `${SYSTEM_PROMPT}\n\nCONTEXTE RÉEL DU COMPTE :\n${context.summaryText}`,
      temperature: 0.4,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Jimmy n'a pas renvoyé de réponse exploitable.");
  }
  return text;
}
