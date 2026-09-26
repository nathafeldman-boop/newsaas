import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getAnthropicModel, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";

// Utilise l'outil de recherche web natif de Claude (server-side : exécuté
// sur l'infra Anthropic, pas besoin de boucle d'appel côté serveur). On ne
// fait JAMAIS confiance au résumé que le modèle fait de ces pages : on ne
// récupère ici que des URLs candidates, qui repassent ensuite par
// ingestOffer() (fetch de la vraie page + extraction Claude classique)
// avant d'atterrir en base. Si le modèle "invente" une URL qui n'existe
// pas, ingestOffer échouera simplement au fetch — aucune offre fabriquée
// ne peut atteindre la base par ce chemin.
//
// output_config.format (sorties structurées) n'est pas combiné avec l'outil
// de recherche web ici : on demande un JSON en fin de réponse dans le
// prompt et on le parse/valide nous-mêmes (même doctrine que l'ancienne
// implémentation Mistral) plutôt que de s'appuyer sur une combinaison non
// documentée des deux fonctionnalités.

const discoverySchema = z.object({
  urls: z.array(z.string()),
});

const SYSTEM_PROMPT = `Tu cherches des offres d'alternance et de stage réelles et
actuellement ouvertes en France, publiées sur le web public (Welcome to the
Jungle, Indeed, HelloWork, LinkedIn, France Travail, sites carrière
d'entreprises...).

Une fois ta recherche terminée, réponds UNIQUEMENT avec un JSON de cette forme, sans texte
autour, sans bloc de code markdown :
{"urls": ["https://...", "https://..."]}

Règles strictes :
- Chaque URL doit pointer directement vers UNE annonce individuelle précise
  (jamais une page de recherche, de liste, ou la page d'accueil d'un site).
- N'invente jamais une URL. Si tu n'es pas sûr qu'une page existe réellement
  suite à ta recherche, ne l'inclus pas plutôt que de deviner.
- Pas de doublons.`;

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseJsonLoosely(text: string): unknown {
  // Le modèle enveloppe parfois quand même la réponse dans un bloc de code
  // markdown malgré la consigne -- on retire les fences avant de parser
  // plutôt que d'échouer sur un JSON par ailleurs valide.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function discoverOfferUrls(query: string, count = 5): Promise<string[]> {
  const client = getAnthropicClient();
  const model = getAnthropicModel();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Recherche : ${count} offres pour "${query}".` },
  ];
  // Pas de Tool[] ici : Tool est la variante "outil personnalisé" -- web_search
  // est un outil serveur avec son propre type dédié (WebSearchTool20260209).
  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 8 },
  ];

  let response = await client.messages.create(
    { model, max_tokens: 3000, system: SYSTEM_PROMPT, temperature: 0.2, tools, messages },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  // Une recherche qui enchaîne beaucoup d'appels peut s'interrompre en
  // pause_turn (limite d'itérations serveur) avant la réponse finale --
  // une seule relance suffit pour ce cas d'usage (5-8 résultats), pas
  // besoin d'une boucle agentique complète ici.
  if (response.stop_reason === "pause_turn") {
    messages.push({ role: "assistant", content: response.content });
    response = await client.messages.create(
      { model, max_tokens: 3000, system: SYSTEM_PROMPT, temperature: 0.2, tools, messages },
      { timeout: ANTHROPIC_TIMEOUT_MS },
    );
  }

  const text = extractText(response.content).trim();
  if (!text) {
    throw new Error("Claude n'a renvoyé aucun texte exploitable.");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonLoosely(text);
  } catch {
    throw new Error("Claude n'a pas renvoyé de JSON exploitable.");
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
