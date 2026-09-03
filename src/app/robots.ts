import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PUBLIC_ALLOW = ["/", "/offres", "/legal", "/login", "/inscription"];
const PRIVATE_DISALLOW = [
  "/api/",
  "/admin/",
  "/swipe",
  "/favoris",
  "/mes-candidatures",
  "/parrainage",
  "/profil",
  "/cv",
  "/onboarding",
  "/auth/",
  "/candidature/",
];

// Agents connus des moteurs "réponse" / IA (ChatGPT, Perplexity, Claude,
// Google AI Overviews...) : listés explicitement plutôt que de compter
// uniquement sur le groupe "*" générique, pour lever toute ambiguïté sur le
// fait qu'ils sont les bienvenus sur le même contenu public que Google —
// c'est ce contenu (offres, page d'accueil, pages légales) qu'on veut voir
// cité par les assistants IA.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: PUBLIC_ALLOW, disallow: PRIVATE_DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
