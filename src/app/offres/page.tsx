import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchActiveOfferCount, fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { getSectorSegments, getCitySegments } from "@/lib/offers/segments";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { SegmentChips } from "@/components/offers/SegmentChips";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";
import { plural } from "@/lib/seo/programmaticPage";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const page = parsePageParam((await searchParams).page);
  // Nombre réel d'offres (compte en cache 10 min) dans le titre, comme
  // /offres/alternance et /offres/stage ; sans compte, titre générique.
  const count = await fetchActiveOfferCount("all").catch(() => 0);
  const year = new Date().getFullYear();
  const title = count > 0
    ? `Offres d'alternance et de stage ${year} : ${count.toLocaleString("fr-FR")} offres à pourvoir`
    : "Toutes les offres d'alternance et de stage";
  return {
    title: pagedTitle(title, page),
    description: `${count > 0 ? `${count.toLocaleString("fr-FR")} offres d'alternance et de stage en ligne, mises à jour chaque jour. ` : ""}Parcours-les sans créer de compte, par métier, par ville ou par secteur.${page > 1 ? ` Page ${page}.` : ""}`,
    alternates: { canonical: `${SITE_URL}${pagedPath("/offres", page)}` },
  };
}

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

  const page = parsePageParam(pageParam);
  const [{ offers, count, totalPages }, sectorSegments, citySegments] = await Promise.all([
    fetchPublicOffers(undefined, page),
    getSectorSegments(),
    getCitySegments(),
  ]);
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres d&apos;alternance et de stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {plural(count, "offre active", "offres actives")}. Crée un compte pour matcher automatiquement les tiennes.
      </p>

      <OffersSegmentNav />
      <SegmentChips title="Par secteur" basePath="/offres/secteur" segments={sectorSegments} />
      <SegmentChips title="Par ville" basePath="/offres/ville" segments={citySegments} />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres" />
    </div>
  );
}
