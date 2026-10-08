import type { Metadata } from "next";
import { OffersWidget } from "@/components/widget/OffersWidget";

// Variante métier du widget (voir ../page.tsx).
export const revalidate = 3600;
export const metadata: Metadata = { title: "Offres", robots: { index: false, follow: true } };

export async function generateStaticParams() {
  return [];
}

export default async function WidgetCityMetierPage({
  params,
}: {
  params: Promise<{ type: string; ville: string; metier: string }>;
}) {
  const { type, ville, metier } = await params;
  return <OffersWidget type={type} ville={ville} metierSlug={metier} />;
}
