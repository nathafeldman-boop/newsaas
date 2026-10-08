import type { Metadata } from "next";

// Directives des pages indexables : grands aperçus autorisés (image en
// grand, extrait complet), condition pour Google Discover et des résultats
// plus visibles dans Google et Bing. Partagées par le layout racine et les
// pages qui choisissent elles-mêmes entre index et noindex : un `robots`
// défini sur une page (même à undefined) remplace celui du layout en entier.
export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  "max-image-preview": "large",
  "max-snippet": -1,
  "max-video-preview": -1,
};
