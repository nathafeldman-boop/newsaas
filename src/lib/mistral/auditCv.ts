import { z } from "zod";
import { getMistralClient } from "@/lib/mistral/client";

export const cvAuditSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(8),
  missing_sections: z.array(z.string()).max(6),
});

export type CvAudit = z.infer<typeof cvAuditSchema>;

const SYSTEM_PROMPT = `Tu es un expert RH qui aide des étudiants et jeunes diplômés français à
préparer leur candidature à une alternance ou un stage. On te donne le texte brut extrait
d'un CV. Évalue-le et réponds UNIQUEMENT avec un objet JSON valide, sans texte autour,
avec exactement ces champs :

{
  "score": number (0 à 100, note globale du CV pour candidater à une alternance/stage en France),
  "strengths": string[] (2 à 5 points forts concrets, en français),
  "improvements": string[] (3 à 6 axes d'amélioration concrets et actionnables, en français),
  "missing_sections": string[] (sections/informations importantes manquantes ou incomplètes, en français ; liste vide si rien à signaler)
}

Sois bienveillant mais honnête et concret. Base la note sur : clarté de présentation,
pertinence du contenu pour une alternance/un stage, mise en avant des compétences et
projets, structure, et absence de fautes ou d'incohérences évidentes. Ne mets jamais
100 si tu identifies au moins une amélioration possible.`;

export async function auditCvText(cvText: string): Promise<CvAudit> {
  const client = getMistralClient();
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";

  const result = await client.chat.complete({
    model,
    temperature: 0.2,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Texte du CV :\n\n${cvText.slice(0, 15000)}` },
    ],
  });

  const content = result.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((c) => ("text" in c ? c.text : "")).join("")
    : (content ?? "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Mistral n'a pas renvoyé de JSON exploitable.");
  }

  return cvAuditSchema.parse(parsed);
}
