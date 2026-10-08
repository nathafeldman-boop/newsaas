import type { MetadataRoute } from "next";

// Stageio s'utilise surtout sur téléphone : avec ce manifeste, « Ajouter à
// l'écran d'accueil » l'installe comme une appli (icône, plein écran, sans
// barre du navigateur). Couleurs = --color-bg et --color-accent.
// Complété le 08/10 (id, icônes 192 et « maskable », raccourcis, catégories)
// pour pouvoir publier l'appli sur le Play Store et le Microsoft Store via
// PWABuilder (voir docs/referencement-partout.md) : les étudiants cherchent
// aussi « appli alternance » dans les magasins d'applis.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Stageio : alternance et stage",
    short_name: "Stageio",
    description:
      "Les offres d'alternance et de stage à swiper, triées selon ta ville et ton métier. Mises à jour chaque jour, gratuit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eaf5f8",
    theme_color: "#0f9c56",
    lang: "fr",
    dir: "ltr",
    categories: ["education", "business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Offres d'alternance", short_name: "Alternance", url: "/alternance", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Offres de stage", short_name: "Stages", url: "/stage", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Guides alternance et stage", short_name: "Guides", url: "/guides", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
