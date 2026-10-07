// www, pas apex : stageio.fr fait une redirection 308 permanente vers
// www.stageio.fr (voir next.config / DNS), donc toute URL absolue générée
// ici (sitemap, canonical, OG, JSON-LD) doit pointer directement sur la
// destination finale plutôt que de faire crawler un saut de redirection
// supplémentaire sur chaque page à chaque fois.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.stageio.fr").replace(/\/$/, "");

// Comptes officiels de Stageio (TikTok, Instagram, LinkedIn...). Repris dans
// le JSON-LD Organization ("sameAs") et sur /a-propos : c'est ce qui permet à
// Google et aux assistants IA de relier ces comptes à la marque. Ne mettre
// que des comptes qui existent vraiment.
export const SOCIAL_PROFILES: { name: string; url: string }[] = [];

export const CONTACT_EMAIL = "contact@stageio.fr";
