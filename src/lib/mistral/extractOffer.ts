import { z } from "zod";
import { getMistralClient } from "@/lib/mistral/client";

export const extractedOfferSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  location: z.string().min(1),
  contract_type: z.enum(["alternance", "stage"]),
  sector: z.string().nullable().optional(),
  description: z.string().min(1),
  requirements: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  remote_policy: z.string().nullable().optional(),
  apply_url: z.string().url().nullable().optional(),
});

export type ExtractedOffer = z.infer<typeof extractedOfferSchema>;

const SYSTEM_PROMPT = `Tu es un extracteur de données pour une plateforme française de recherche
d'alternance et de stage. On te donne le texte brut d'une page d'offre d'emploi
(parfois bruité : menus, cookies, etc. peuvent traîner dans le texte).

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces
champs :
{
  "title": string,
  "company": string,
  "location": string (ville ou "Remote"),
  "contract_type": "alternance" | "stage",
  "sector": string | null,
  "description": string (2 à 5 phrases, en français, résumant la mission),
  "requirements": string | null (profil recherché),
  "duration": string | null (ex: "12-24 mois", "6 mois"),
  "salary": string | null (ex: "900-1200€/mois"),
  "remote_policy": string | null ("sur site" | "hybride" | "remote"),
  "apply_url": string | null (lien direct de candidature si présent dans le texte)
}

Si une info est absente du texte, mets null plutôt que d'inventer. Ne fabrique jamais
d'entreprise ou de lieu qui n'apparaît pas dans le texte fourni.`;

export async function extractOfferFromText(
  rawText: string,
  hints?: { sourceUrl?: string; contractTypeHint?: "alternance" | "stage" },
): Promise<ExtractedOffer> {
  const client = getMistralClient();
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";

  const truncated = rawText.slice(0, 12000);

  const userContent = [
    hints?.sourceUrl ? `URL source : ${hints.sourceUrl}` : null,
    hints?.contractTypeHint
      ? `Indice : il s'agit probablement d'un(e) ${hints.contractTypeHint}.`
      : null,
    "Texte de l'offre :",
    truncated,
  ]
    .filter(Boolean)
    .join("\n\n");

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

  return extractedOfferSchema.parse(parsed);
}
