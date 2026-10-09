import { renderOgCard } from "@/lib/seo/ogImage";
import { CV_STAGE_OG_CARD } from "@/lib/seo/ogCards";

// Voir app/layout.tsx : une image bloquée par la base s'arrête au bout de 30 s.
export const maxDuration = 30;

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CV de stage : générateur gratuit";

export default async function Image() {
  return renderOgCard(CV_STAGE_OG_CARD);
}
