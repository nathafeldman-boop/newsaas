import { renderOgCard } from "@/lib/seo/ogImage";
import { companyOgCard } from "@/lib/seo/ogCards";

// Aperçu de partage (WhatsApp, LinkedIn...) : voir src/lib/seo/ogImage.tsx.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Entreprise qui recrute en alternance et en stage sur Stageio";

export default async function Image({ params }: { params: Promise<{ entreprise: string }> }) {
  const { entreprise } = await params;
  return renderOgCard(await companyOgCard(entreprise));
}
