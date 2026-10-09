import { renderOgCard } from "@/lib/seo/ogImage";
import { departementOgCard } from "@/lib/seo/ogCards";

// Voir app/layout.tsx : une image bloquée par la base s'arrête au bout de 30 s.
export const maxDuration = 30;

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Offres d'alternance sur Stageio";

export default async function Image({ params }: { params: Promise<{ dep: string; metier: string }> }) {
  const { dep, metier } = await params;
  return renderOgCard(await departementOgCard("alternance", dep, metier));
}
