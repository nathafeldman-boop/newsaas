import type { Metadata } from "next";
import { OffersWidget } from "@/components/widget/OffersWidget";

// Page affichée dans une iframe chez un tiers : jamais indexée (même contenu
// que la page ville), mise en cache une heure.
export const revalidate = 3600;
export const metadata: Metadata = { title: "Offres", robots: { index: false, follow: true } };

export async function generateStaticParams() {
  return [];
}

export default async function WidgetCityPage({ params }: { params: Promise<{ type: string; ville: string }> }) {
  const { type, ville } = await params;
  return <OffersWidget type={type} ville={ville} />;
}
