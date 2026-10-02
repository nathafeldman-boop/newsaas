import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCitySegment, fetchOffersForCity } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const segment = await getCitySegment(ville);
  if (!segment) return { title: "Ville introuvable", robots: { index: false, follow: true } };

  const url = `${SITE_URL}/offres/ville/${segment.slug}`;
  return {
    title: `Offres d'alternance et de stage à ${segment.label}`,
    description: `${segment.count} offre(s) d'alternance et de stage à ${segment.label} actuellement sur Stageio. Parcours-les sans créer de compte.`,
    alternates: { canonical: url },
  };
}

export default async function CityOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { ville } = await params;
  const segment = await getCitySegment(ville);
  if (!segment) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { offers, count, totalPages } = await fetchOffersForCity(segment.slug, page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <Link href="/offres" style={{ fontSize: 13 }}>
        ← Toutes les offres
      </Link>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        Offres d&apos;alternance et de stage à {segment.label}
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) active(s) à {segment.label}. Crée un compte pour matcher automatiquement
        les tiennes.
      </p>

      <PublicOffersGrid
        offers={offers}
        page={page}
        totalPages={totalPages}
        basePath={`/offres/ville/${segment.slug}`}
      />
    </div>
  );
}
