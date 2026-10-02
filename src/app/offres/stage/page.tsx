import type { Metadata } from "next";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Offres de stage",
  description:
    "Toutes les offres de stage disponibles sur Stageio, mises à jour chaque jour. Parcours-les sans créer de compte.",
  alternates: { canonical: `${SITE_URL}/offres/stage` },
};

export default async function StageOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { offers, count, totalPages } = await fetchPublicOffers("stage", page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres de stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) de stage active(s). Crée un compte pour matcher automatiquement les
        tiennes.
      </p>

      <OffersSegmentNav active="stage" />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres/stage" />
    </div>
  );
}
