import { z } from "zod";
import { getGroqClient, getGroqModel } from "@/lib/groq/client";

export const cvAuditSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(8),
  missing_sections: z.array(z.string()).max(6),
});

export type CvAudit = z.infer<typeof cvAuditSchema>;

const SYSTEM_PROMPT = `Tu es un expert RH qui aide des étudiants et jeunes diplômés français à
préparer leur candidature à une alternance ou un stage. On te donne le texte brut extrait
d'un CV, et si disponible le contexte de ce que le candidat vise réellement (secteur(s),
métier(s), niveau d'études, expérience). Évalue-le et réponds UNIQUEMENT avec un objet JSON
valide, sans texte autour, avec exactement ces champs :

{
  "score": number (0 à 100, note globale du CV pour candidater à une alternance/stage en France),
  "strengths": string[] (2 à 5 points forts concrets, en français),
  "improvements": string[] (3 à 6 axes d'amélioration concrets et actionnables, en français),
  "missing_sections": string[] (sections/informations importantes manquantes ou incomplètes, en français ; liste vide si rien à signaler)
}

Si le contexte cible (secteur/métier visé) est fourni, évalue et formule CHAQUE point en
fonction de cette cible précise plutôt qu'en langage générique -- ex: "Pour une alternance en
marketing digital, il manque une section projets avec des résultats chiffrés" plutôt que
"Il manque une section projets". Sans ce contexte, reste générique mais toujours concret.

Sois bienveillant mais honnête et concret. Base la note sur : clarté de présentation,
pertinence du contenu pour la cible visée, mise en avant des compétences et projets,
structure, et absence de fautes ou d'incohérences évidentes. Ne mets jamais 100 si tu
identifies au moins une amélioration possible.`;

export type CvAuditContext = {
  sectors?: string[];
  targetJobs?: string[];
  educationLevel?: string | null;
  experienceLevel?: string | null;
};

function buildContextLine(context?: CvAuditContext): string | null {
  if (!context) return null;
  const parts: string[] = [];
  if (context.sectors?.length) parts.push(`Secteur(s) visé(s) : ${context.sectors.join(", ")}`);
  if (context.targetJobs?.length) parts.push(`Métier(s) visé(s) : ${context.targetJobs.join(", ")}`);
  if (context.educationLevel) parts.push(`Niveau d'études : ${context.educationLevel}`);
  if (context.experienceLevel) parts.push(`Expérience : ${context.experienceLevel}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export async function auditCvText(cvText: string, context?: CvAuditContext): Promise<CvAudit> {
  const client = getGroqClient();
  const model = getGroqModel();

  const contextLine = buildContextLine(context);
  const userContent = contextLine
    ? `Ce que le candidat vise : ${contextLine}\n\nTexte du CV :\n\n${cvText.slice(0, 15000)}`
    : `Texte du CV :\n\n${cvText.slice(0, 15000)}`;

  const result = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const text = result.choices?.[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("L'IA n'a pas renvoyé de JSON exploitable.");
  }

  return cvAuditSchema.parse(parsed);
}
