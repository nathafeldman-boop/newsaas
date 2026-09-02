import { z } from "zod";
import { getMistralClient, getMistralModel } from "@/lib/mistral/client";

// Utilise l'outil de recherche web natif de Mistral (Conversations API,
// /v1/conversations — différent de l'endpoint chat.complete utilisé
// ailleurs) pour repérer des annonces réelles. On ne fait JAMAIS confiance
// au résumé que Mistral fait de ces pages : on ne récupère ici que des URLs
// candidates, qui repassent ensuite par ingestOffer() (fetch de la vraie
// page + extraction Mistral classique) avant d'atterrir en base. Si Mistral
// "invente" une URL qui n'existe pas, ingestOffer échouera simplement au
// fetch — aucune offre fabriquée ne peut atteindre la base par ce chemin.

const discoverySchema = z.object({
  urls: z.array(z.string()),
});

const SYSTEM_PROMPT = `Tu cherches des offres d'alternance et de stage réelles et
actuellement ouvertes en France, publiées sur le web public (Welcome to the
Jungle, Indeed, HelloWork, LinkedIn, France Travail, sites carrière
d'entreprises...).

Réponds UNIQUEMENT avec un JSON de cette forme, sans texte autour :
{"urls": ["https://...", "https://..."]}

Règles strictes :
- Chaque URL doit pointer directement vers UNE annonce individuelle précise
  (jamais une page de recherche, de liste, ou la page d'accueil d'un site).
- N'invente jamais une URL. Si tu n'es pas sûr qu'une page existe réellement
  suite à ta recherche, ne l'inclus pas plutôt que de deviner.
- Pas de doublons.`;

export async function discoverOfferUrls(
  query: string,
  count = 5,
): Promise<string[]> {
  const client = getMistralClient();
  const model = getMistralModel();

  const result = await client.beta.conversations.start({
    model,
    inputs: `${SYSTEM_PROMPT}\n\nRecherche : ${count} offres pour "${query}".`,
    tools: [{ type: "web_search" }],
    completionArgs: { responseFormat: { type: "json_object" } },
  });

  const messageOutput = result.outputs.find(
    (o) => "type" in o && o.type === "message.output",
  );
  if (!messageOutput || !("content" in messageOutput)) {
    throw new Error("Mistral n'a renvoyé aucun message final.");
  }

  const content = messageOutput.content;
  const text = Array.isArray(content)
    ? content.map((c) => ("text" in c ? c.text : "")).join("")
    : content;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Mistral n'a pas renvoyé de JSON exploitable.");
  }

  const { urls } = discoverySchema.parse(parsed);
  return urls.filter((u) => {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  });
}
