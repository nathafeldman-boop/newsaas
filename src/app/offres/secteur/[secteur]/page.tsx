import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSectorSegment, fetchOffersForSector } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";
import { plural } from "@/lib/seo/programmaticPage";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ secteur: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { secteur } = await params;
  const page = parsePageParam((await searchParams).page);
  const segment = await getSectorSegment(secteur);
  if (!segment) return { title: "Secteur introuvable", robots: { index: false, follow: true } };

  const url = `${SITE_URL}${pagedPath(`/offres/secteur/${segment.slug}`, page)}`;
  return {
    title: pagedTitle(`Offres d'alternance et de stage en ${segment.label}`, page),
    description: `${plural(segment.count, "offre")} d'alternance et de stage en ${segment.label} actuellement sur Stageio. Parcours-les sans créer de compte.${page > 1 ? ` Page ${page}.` : ""}`,
    alternates: { canonical: url },
  };
}

export default async function SectorOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ secteur: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { secteur } = await params;
  const segment = await getSectorSegment(secteur);
  if (!segment) notFound();

  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { offers, count, totalPages } = await fetchOffersForSector(segment, page);
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <Link href="/offres" style={{ fontSize: 13 }}>
        ← Toutes les offres
      </Link>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        Offres d&apos;alternance et de stage en {segment.label}
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {plural(count, "offre active", "offres actives")} en {segment.label}. Crée un compte pour matcher automatiquement
        les tiennes.
      </p>

      <PublicOffersGrid
        offers={offers}
        page={page}
        totalPages={totalPages}
        basePath={`/offres/secteur/${segment.slug}`}
      />
    </div>
  );
}
