import { renderOgCard } from "@/lib/seo/ogImage";
import { programmaticOgCard } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Offres de stage sur Stageio";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderOgCard(await programmaticOgCard("stage", slug));
}
