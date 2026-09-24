import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

// true tant que la clé n'est pas renseignée : sert à décider, côté appelant,
// de tenter Gemini ou de retomber directement sur le générateur statique
// (voir generateCoverLetterAction / auditCvAction) sans même faire d'appel.
export function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY?.trim();
}

export function getGeminiClient() {
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquant côté serveur.");
  }

  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

// Même logique que pour Mistral (voir generateCoverLetter.ts) : sans borne
// explicite, un appel qui traîne peut aller jusqu'au timeout de la fonction
// serverless elle-même, auquel cas le repli statique n'a jamais l'occasion
// de se déclencher -- toute la promesse "jamais de panne visible" du design
// hybride reposerait alors sur un point de défaillance qu'on ne contrôle pas.
export const GEMINI_TIMEOUT_MS = 15_000;
