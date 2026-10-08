import type { MetadataRoute } from "next";

// Stageio s'utilise surtout sur téléphone : avec ce manifeste, « Ajouter à
// l'écran d'accueil » l'installe comme une appli (icône, plein écran, sans
// barre du navigateur). Couleurs = --color-bg et --color-accent.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stageio : alternance et stage",
    short_name: "Stageio",
    description: "Les offres d'alternance et de stage à swiper, triées selon ta ville et ton métier.",
    start_url: "/",
    display: "standalone",
    background_color: "#eaf5f8",
    theme_color: "#0f9c56",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
