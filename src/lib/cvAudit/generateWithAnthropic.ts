import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getAnthropicModel, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";
import { buildProfileContextLines, type ProfileForAI } from "@/lib/ai/profileContext";
import { cvAuditSchema, type CvAudit } from "@/lib/cvAudit/schema";

const SYSTEM_PROMPT = `Tu es un expert RH qui aide des étudiants et jeunes diplômés français à
préparer leur candidature à une alternance ou un stage. On te donne le texte brut extrait
d'un CV et le profil complet du candidat (secteurs visés, métiers visés, compétences,
formation, expérience, mobilité, disponibilité...). Évalue le CV et renvoie ta réponse en
respectant le format demandé.

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

export async function auditCvWithAnthropic(cvText: string, profile: ProfileForAI): Promise<CvAudit> {
  const client = getAnthropicClient();
  const model = getAnthropicModel();

  const response = await client.messages.parse(
    {
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      temperature: 0.2,
      messages: [{ role: "user", content: buildUserPrompt(cvText, profile) }],
      output_config: { format: zodOutputFormat(cvAuditSchema) },
    },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  if (!response.parsed_output) {
    throw new Error("Claude n'a pas renvoyé de JSON exploitable.");
  }

  return response.parsed_output;
}
