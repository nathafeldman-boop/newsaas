// www, pas apex : stageio.fr fait une redirection 308 permanente vers
// www.stageio.fr (voir next.config / DNS), donc toute URL absolue générée
// ici (sitemap, canonical, OG, JSON-LD) doit pointer directement sur la
// destination finale plutôt que de faire crawler un saut de redirection
// supplémentaire sur chaque page à chaque fois.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.stageio.fr").replace(/\/$/, "");
