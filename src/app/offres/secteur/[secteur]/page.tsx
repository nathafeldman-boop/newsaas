import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSectorSegment, fetchOffersForSector } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ secteur: string }>;
}): Promise<Metadata> {
  const { secteur } = await params;
  const segment = await getSectorSegment(secteur);
  if (!segment) return { title: "Secteur introuvable", robots: { index: false, follow: true } };

  const url = `${SITE_URL}/offres/secteur/${segment.slug}`;
  return {
    title: `Offres d'alternance et de stage en ${segment.label}`,
    description: `${segment.count} offre(s) d'alternance et de stage en ${segment.label} actuellement sur Stageio. Parcours-les sans créer de compte.`,
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
  const page = Math.max(1, Number(pageParam) || 1);
  const { offers, count, totalPages } = await fetchOffersForSector(segment.label, page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <Link href="/offres" style={{ fontSize: 13 }}>
        ← Toutes les offres
      </Link>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        Offres d&apos;alternance et de stage en {segment.label}
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) active(s) en {segment.label}. Crée un compte pour matcher automatiquement
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
