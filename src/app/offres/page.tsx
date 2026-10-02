import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Toutes les offres d'alternance et de stage",
  description:
    "Parcours les offres d'alternance et de stage disponibles sur Stageio, sans créer de compte.",
  alternates: { canonical: `${SITE_URL}/offres` },
};

export default async function PublicOffersIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { page: pageParam, type: typeParam } = await searchParams;

  // Consolidation SEO : ?type=... vivait ici avant que /offres/alternance et
  // /offres/stage existent en pages dédiées (metadata + canonical propres).
  // Redirige plutôt que de laisser deux URLs indexables porter le même
  // contenu.
  if (typeParam === "alternance" || typeParam === "stage") {
    redirect(`/offres/${typeParam}${pageParam ? `?page=${pageParam}` : ""}`);
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const { offers, count, totalPages } = await fetchPublicOffers(undefined, page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres d&apos;alternance et de stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) active(s). Crée un compte pour matcher automatiquement les tiennes.
      </p>

      <OffersSegmentNav />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres" />
    </div>
  );
}
