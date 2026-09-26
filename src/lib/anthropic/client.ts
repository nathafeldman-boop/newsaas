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
// déclencher. Remonté de 15s à 30s le 26/09 : les Server Actions qui
// appellent Claude tournent désormais avec maxDuration=60s (voir leurs
// fichiers respectifs -- elles tournaient avant sur le défaut Vercel 10s,
// plus court que ce timeout interne, donc la fonction se faisait tuer par
// la plateforme avant même que ce timeout ou le repli statique n'aient une
// chance de s'exécuter). 30s laisse une vraie marge à Claude Opus 5, qui
// réfléchit par défaut (adaptive thinking, contrairement à Gemini/Mistral
// avant lui), tout en gardant de la marge sous les 60s pour le
// téléchargement/l'extraction du CV et le repli statique en cas d'échec.
export const ANTHROPIC_TIMEOUT_MS = 30_000;
