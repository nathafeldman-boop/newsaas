import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

// true tant que la clé n'est pas renseignée : sert à décider, côté appelant,
// de tenter Claude ou de retomber directement sur le générateur statique
// (même doctrine que Gemini avant lui -- voir generateCoverLetterAction /
// auditCvAction) sans même faire d'appel.
export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function getAnthropicClient() {
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquant côté serveur.");
  }

  cached = new Anthropic({ apiKey });
  return cached;
}

export function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5";
}

// Même logique que pour Gemini/Mistral avant lui : sans borne explicite, un
// appel qui traîne peut aller jusqu'au timeout de la fonction serverless
// elle-même, auquel cas le repli statique n'a jamais l'occasion de se
// déclencher.
export const ANTHROPIC_TIMEOUT_MS = 15_000;
