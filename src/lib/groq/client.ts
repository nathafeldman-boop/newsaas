import Groq from "groq-sdk";

// Alternative gratuite à Mistral (compte Mistral bloqué en rate-limit
// permanent, x-ratelimit-limit-req-minute: 0, cf. lettres de motivation et
// audit CV cassés depuis début septembre) : Groq héberge des modèles open
// source (Llama, etc.) avec un palier gratuit aux limites largement
// suffisantes pour cette appli, sans carte bancaire. SDK compatible OpenAI.
let cached: Groq | null = null;

export function getGroqClient() {
  if (cached) return cached;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY manquant côté serveur.");
  }

  cached = new Groq({ apiKey });
  return cached;
}

// openai/gpt-oss-120b : remplaçant recommandé par Groq depuis la
// dépréciation de llama-3.3-70b-versatile sur le palier gratuit (17 juin
// 2026, cf. console.groq.com/docs/deprecations) -- confirmé en prod par un
// 404 model_not_found sur l'ancien modèle. Supporte le mode JSON strict
// (response_format json_object) nécessaire à l'audit CV et au générateur de
// quiz d'entretien. Redéfinissable via GROQ_MODEL si Groq déprécie encore.
export function getGroqModel() {
  return process.env.GROQ_MODEL || "openai/gpt-oss-120b";
}
