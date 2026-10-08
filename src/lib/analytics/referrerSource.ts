// Source d'une visite SANS paramètre utm_source, déduite de la page d'où
// vient le visiteur (en-tête Referer). Sans ça, tout le trafic Google, Bing,
// ChatGPT... tombait dans "direct / inconnu" sur le dashboard admin : aucun
// moyen de savoir si le référencement rapporte des visites et des inscrits.
// Les moteurs n'envoient que le domaine (jamais la recherche tapée), c'est
// tout ce dont on a besoin ici.
const RULES: { pattern: RegExp; source: string; medium: string }[] = [
  // IA d'abord : gemini.google.com doit compter comme IA, pas comme Google.
  { pattern: /(^|\.)(chatgpt\.com|openai\.com)$/, source: "chatgpt", medium: "ai" },
  { pattern: /(^|\.)perplexity\.ai$/, source: "perplexity", medium: "ai" },
  { pattern: /(^|\.)gemini\.google\.com$/, source: "gemini", medium: "ai" },
  { pattern: /(^|\.)copilot\.microsoft\.com$/, source: "copilot", medium: "ai" },
  { pattern: /(^|\.)claude\.ai$/, source: "claude", medium: "ai" },
  { pattern: /(^|\.)meta\.ai$/, source: "meta-ai", medium: "ai" },
  { pattern: /(^|\.)(grok\.com|x\.ai)$/, source: "grok", medium: "ai" },
  { pattern: /(^|\.)deepseek\.com$/, source: "deepseek", medium: "ai" },
  { pattern: /(^|\.)chat\.mistral\.ai$/, source: "mistral", medium: "ai" },
  { pattern: /(^|\.)google\.[a-z.]+$/, source: "google", medium: "organic" },
  { pattern: /(^|\.)bing\.com$/, source: "bing", medium: "organic" },
  { pattern: /(^|\.)duckduckgo\.com$/, source: "duckduckgo", medium: "organic" },
  { pattern: /(^|\.)(qwant\.com|ecosia\.org|search\.yahoo\.com|yahoo\.com|search\.brave\.com)$/, source: "autre-moteur", medium: "organic" },
  { pattern: /(^|\.)tiktok\.com$/, source: "tiktok", medium: "social" },
  { pattern: /(^|\.)instagram\.com$/, source: "instagram", medium: "social" },
  { pattern: /(^|\.)(facebook\.com|fb\.com|messenger\.com)$/, source: "facebook", medium: "social" },
  { pattern: /(^|\.)(linkedin\.com|lnkd\.in)$/, source: "linkedin", medium: "social" },
  { pattern: /(^|\.)reddit\.com$/, source: "reddit", medium: "social" },
  { pattern: /(^|\.)snapchat\.com$/, source: "snapchat", medium: "social" },
  { pattern: /(^|\.)(x\.com|twitter\.com|t\.co)$/, source: "x", medium: "social" },
  { pattern: /(^|\.)(youtube\.com|youtu\.be)$/, source: "youtube", medium: "social" },
  { pattern: /(^|\.)(whatsapp\.com|wa\.me)$/, source: "whatsapp", medium: "social" },
];

export function sourceFromReferrer(referer: string | null): { source: string; medium: string } | null {
  if (!referer) return null;
  let host: string;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
  // Navigation interne (ou preview Vercel) : pas une source d'acquisition.
  if (host.endsWith("stageio.fr") || host.endsWith(".vercel.app") || host === "localhost") return null;
  const rule = RULES.find((r) => r.pattern.test(host));
  if (rule) return { source: rule.source, medium: rule.medium };
  return { source: host.replace(/^www\./, ""), medium: "referral" };
}

// utm_source posé par l'assistant lui-même (ChatGPT ajoute
// ?utm_source=chatgpt.com à ses liens) : ramené au même nom que la source
// déduite du referer, sinon le dashboard compte « chatgpt.com » et
// « chatgpt » sur deux lignes. Les autres valeurs (pubs, liens partagés)
// restent telles quelles.
export function normalizeUtmSource(value: string): { source: string; medium: string | null } {
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const rule = RULES.find((r) => r.medium === "ai" && r.pattern.test(host));
  return rule ? { source: rule.source, medium: rule.medium } : { source: value, medium: null };
}
