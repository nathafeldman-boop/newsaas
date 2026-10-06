import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const page = parsePageParam((await searchParams).page);
  return {
    title: pagedTitle("Offres de stage", page),
    description: `Toutes les offres de stage disponibles sur Stageio, mises à jour chaque jour. Parcours-les sans créer de compte.${page > 1 ? ` Page ${page}.` : ""}`,
    alternates: { canonical: `${SITE_URL}${pagedPath("/offres/stage", page)}` },
  };
}

export default async function StageOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { offers, count, totalPages } = await fetchPublicOffers("stage", page);
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres de stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) de stage active(s). Crée un compte pour matcher automatiquement les
        tiennes.
      </p>

      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <Link href="/stage">Offres de stage par métier et par ville</Link>
      </p>
      <OffersSegmentNav active="stage" />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres/stage" />
    </div>
  );
}
