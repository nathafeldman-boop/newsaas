import { renderOgCard } from "@/lib/seo/ogImage";
import { offerOgCard } from "@/lib/seo/ogCards";

// Voir app/layout.tsx : une image bloquée par la base s'arrête au bout de 30 s.
export const maxDuration = 30;

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Offre d'alternance ou de stage sur Stageio";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderOgCard(await offerOgCard(slug));
}
