import { renderOgCard } from "@/lib/seo/ogImage";
import { regionOgCard } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Offres d'alternance sur Stageio";

export default async function Image({ params }: { params: Promise<{ region: string; metier: string }> }) {
  const { region, metier } = await params;
  return renderOgCard(await regionOgCard("alternance", region, metier));
}
