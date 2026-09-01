import { Mistral } from "@mistralai/mistralai";

let cached: Mistral | null = null;

export function getMistralClient() {
  if (cached) return cached;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY manquant côté serveur.");
  }

  cached = new Mistral({ apiKey });
  return cached;
}
