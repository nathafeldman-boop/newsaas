import { renderOgCard } from "@/lib/seo/ogImage";
import { barometreOgCard } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Baromètre 2026 de l'alternance et des stages";
// Chiffres du jour : régénérée au plus une fois par jour.
export const revalidate = 86400;

export default async function Image() {
  return renderOgCard(await barometreOgCard());
}
