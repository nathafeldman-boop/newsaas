import type { Metadata } from "next";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Offres d'alternance",
  description:
    "Toutes les offres d'alternance disponibles sur Stageio, mises à jour chaque jour. Parcours-les sans créer de compte.",
  alternates: { canonical: `${SITE_URL}/offres/alternance` },
};

export default async function AlternanceOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { offers, count, totalPages } = await fetchPublicOffers("alternance", page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres d&apos;alternance</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) d&apos;alternance active(s). Crée un compte pour matcher automatiquement
        les tiennes.
      </p>

      <OffersSegmentNav active="alternance" />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres/alternance" />
    </div>
  );
}
