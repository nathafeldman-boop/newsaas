import { renderOgCard } from "@/lib/seo/ogImage";
import { SIMULATEUR_OG_CARD } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Simulateur de salaire en alternance 2026";

export default async function Image() {
  return renderOgCard(SIMULATEUR_OG_CARD);
}
