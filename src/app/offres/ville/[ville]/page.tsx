import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCitySegment, fetchOffersForCity } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const page = parsePageParam((await searchParams).page);
  const segment = await getCitySegment(ville);
  if (!segment) return { title: "Ville introuvable", robots: { index: false, follow: true } };

  const url = `${SITE_URL}${pagedPath(`/offres/ville/${segment.slug}`, page)}`;
  return {
    title: pagedTitle(`Offres d'alternance et de stage à ${segment.label}`, page),
    description: `${segment.count} offre(s) d'alternance et de stage à ${segment.label} actuellement sur Stageio. Parcours-les sans créer de compte.${page > 1 ? ` Page ${page}.` : ""}`,
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
  const page = parsePageParam(pageParam);
  const { offers, count, totalPages } = await fetchOffersForCity(segment, page);
  if (page > totalPages) notFound();

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
