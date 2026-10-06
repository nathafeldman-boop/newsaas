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
    title: pagedTitle("Offres d'alternance", page),
    description: `Toutes les offres d'alternance disponibles sur Stageio, mises à jour chaque jour. Parcours-les sans créer de compte.${page > 1 ? ` Page ${page}.` : ""}`,
    alternates: { canonical: `${SITE_URL}${pagedPath("/offres/alternance", page)}` },
  };
}

export default async function AlternanceOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { offers, count, totalPages } = await fetchPublicOffers("alternance", page);
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres d&apos;alternance</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count} offre(s) d&apos;alternance active(s). Crée un compte pour matcher automatiquement
        les tiennes.
      </p>
      <p style={{ fontSize: 14, margin: "4px 0 0" }}>
        Combien tu seras payé ?{" "}
        <Link href="/outils/simulateur-salaire-alternance">Simule ton salaire d&apos;alternant</Link>.
      </p>

      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <Link href="/alternance">Offres d&apos;alternance par métier et par ville</Link>
      </p>
      <OffersSegmentNav active="alternance" />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath="/offres/alternance" />
    </div>
  );
}
