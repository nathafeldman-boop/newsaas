import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getAnthropicModel, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";

const classificationSchema = z.object({
  is_recruiting_reply: z.boolean(),
  matched_company: z.string().nullable(),
  sentiment: z.enum(["positive", "negative", "neutral"]).nullable(),
});

export type EmailClassification = z.infer<typeof classificationSchema>;

const SYSTEM_PROMPT = `Tu analyses un email reçu par un candidat qui a postulé à des
offres d'alternance/stage, pour savoir s'il s'agit d'une réponse de recruteur liée à
l'une de ses candidatures en cours, et si oui si la réponse est positive ou négative.

Règles :
- "is_recruiting_reply" = true seulement si l'email est clairement une réponse d'un
  recruteur/RH à une candidature (invitation entretien, réponse positive/négative,
  demande d'infos complémentaires...). Newsletters, pubs, notifications de jobboards
  génériques (ex: "de nouvelles offres pour vous") = false.
- "matched_company" = le nom de l'entreprise dans la liste fournie qui correspond le
  mieux (d'après l'adresse d'expéditeur, la signature, le sujet), ou null si aucune
  correspondance claire.
- "sentiment" :
  - "positive" = invitation à un entretien, test technique, ou acceptation
  - "negative" = candidature non retenue, refus
  - "neutral" = réponse liée à la candidature mais sans verdict clair (accusé de
    réception, demande de disponibilités sans confirmer un entretien, etc.)
  - null si is_recruiting_reply est false
- Ne mets jamais matched_company ou sentiment sans être raisonnablement confiant.`;

export async function classifyEmailReply(
  email: { from: string | null; subject: string | null; snippet: string },
  candidateCompanies: string[],
): Promise<EmailClassification> {
  const client = getAnthropicClient();
  const model = getAnthropicModel();

  const userContent = [
    `Entreprises auxquelles ce candidat a postulé (liste fermée) : ${candidateCompanies.join(", ") || "(aucune)"}`,
    `De : ${email.from ?? "(inconnu)"}`,
    `Sujet : ${email.subject ?? "(aucun)"}`,
    `Extrait : ${email.snippet}`,
  ].join("\n");

  const response = await client.messages.parse(
    {
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      temperature: 0.1,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: zodOutputFormat(classificationSchema) },
    },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  if (!response.parsed_output) {
    throw new Error("Claude n'a pas renvoyé de JSON exploitable.");
  }

  return response.parsed_output;
}
