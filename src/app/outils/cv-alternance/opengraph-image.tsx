import { renderOgCard } from "@/lib/seo/ogImage";
import { CV_ALTERNANCE_OG_CARD } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CV d'alternance : générateur gratuit";

export default async function Image() {
  return renderOgCard(CV_ALTERNANCE_OG_CARD);
}
