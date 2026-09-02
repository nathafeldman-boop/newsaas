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

// "Small" plutôt que "Large" par défaut : Large exige un palier payant sur
// La Plateforme (403 "tier_not_allowed" sinon) alors que Small est
// accessible dès le tier gratuit. Redéfinissable via MISTRAL_MODEL une fois
// la facturation activée côté Mistral, pour repasser sur un modèle plus
// capable.
export function getMistralModel() {
  return process.env.MISTRAL_MODEL || "mistral-small-latest";
}
