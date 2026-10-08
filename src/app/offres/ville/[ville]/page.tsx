import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCitySegment, fetchOffersForCity } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";
import { cityPhrase, getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { plural } from "@/lib/seo/programmaticPage";

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
    description: `${plural(segment.count, "offre")} d'alternance et de stage à ${segment.label} actuellement sur Stageio. Parcours-les sans créer de compte.${page > 1 ? ` Page ${page}.` : ""}`,
    alternates: { canonical: url },
    // Simple liste qui vise les mêmes recherches que /alternance/[ville] et
    // /stage/[ville] (chiffres, entreprises, métiers, FAQ) : on laisse ces
    // pages-là se positionner. Liens suivis pour que Google découvre les
    // offres.
    robots: { index: false, follow: true },
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
  const [{ offers, count, totalPages }, alternance, stage] = await Promise.all([
    fetchOffersForCity(segment, page),
    getProgrammaticIndex("alternance"),
    getProgrammaticIndex("stage"),
  ]);
  if (page > totalPages) notFound();
  const detailed = [
    { type: "alternance", label: "Alternance", entry: alternance.cities[segment.slug] },
    { type: "stage", label: "Stage", entry: stage.cities[segment.slug] },
  ].filter((x) => x.entry);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <Link href="/offres" style={{ fontSize: 13 }}>
        ← Toutes les offres
      </Link>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        Offres d&apos;alternance et de stage à {segment.label}
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {plural(count, "offre active", "offres actives")} à {segment.label}. Crée un compte pour matcher automatiquement
        les tiennes.
      </p>
      {detailed.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {detailed.map((x) => (
            <Link key={x.type} href={`/${x.type}/${segment.slug}`} className="tag tag-neutral">
              {x.label} {cityPhrase(x.entry.label)} : métiers, entreprises, salaires ({x.entry.count})
            </Link>
          ))}
        </div>
      )}

      <PublicOffersGrid
        offers={offers}
        page={page}
        totalPages={totalPages}
        basePath={`/offres/ville/${segment.slug}`}
      />
    </div>
  );
}
