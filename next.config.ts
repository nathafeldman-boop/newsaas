import type { NextConfig } from "next";

// Adresses courtes à lire dans les vidéos et posts (7/11) : TikTok n'accepte
// pas de lien cliquable sur un compte récent, on affiche « stageio.fr/tiktok ».
// La redirection ajoute les utm (avant le proxy, qui note la visite et pose le
// cookie de source) : chaque visite et inscription est attribuée au réseau.
const SHORT_LINKS: { source: string; network: string }[] = [
  { source: "/tiktok", network: "tiktok" },
  { source: "/fb", network: "facebook" },
  { source: "/insta", network: "instagram" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return SHORT_LINKS.map(({ source, network }) => ({
      source,
      destination: `/offres/alternance?utm_source=${network}&utm_medium=social&utm_campaign=${network}-lien-court`,
      permanent: false,
    }));
  },
};

export default nextConfig;
