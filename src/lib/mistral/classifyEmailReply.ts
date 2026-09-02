import { z } from "zod";
import { getMistralClient, getMistralModel } from "@/lib/mistral/client";

const classificationSchema = z.object({
  is_recruiting_reply: z.boolean(),
  matched_company: z.string().nullable(),
  sentiment: z.enum(["positive", "negative", "neutral"]).nullable(),
});

export type EmailClassification = z.infer<typeof classificationSchema>;

const SYSTEM_PROMPT = `Tu analyses un email reçu par un candidat qui a postulé à des
offres d'alternance/stage, pour savoir s'il s'agit d'une réponse de recruteur liée à
l'une de ses candidatures en cours, et si oui si la réponse est positive ou négative.

Réponds UNIQUEMENT avec un JSON de cette forme, sans texte autour :
{
  "is_recruiting_reply": boolean,
  "matched_company": string | null,
  "sentiment": "positive" | "negative" | "neutral" | null
}

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
  const client = getMistralClient();
  const model = getMistralModel();

  const userContent = [
    `Entreprises auxquelles ce candidat a postulé (liste fermée) : ${candidateCompanies.join(", ") || "(aucune)"}`,
    `De : ${email.from ?? "(inconnu)"}`,
    `Sujet : ${email.subject ?? "(aucun)"}`,
    `Extrait : ${email.snippet}`,
  ].join("\n");

  const result = await client.chat.complete({
    model,
    temperature: 0.1,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
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

  return classificationSchema.parse(parsed);
}
