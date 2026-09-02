import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { offerPath } from "@/lib/offers/publicUrl";
import { SITE_URL } from "@/lib/site";
import type { ContractType } from "@/types/database";

export const metadata: Metadata = {
  title: "Toutes les offres d'alternance et de stage",
  description:
    "Parcours les offres d'alternance et de stage disponibles sur Stageio, sans créer de compte.",
  alternates: { canonical: `${SITE_URL}/offres` },
};

const PAGE_SIZE = 24;

const CONTRACT_LABEL: Record<ContractType, string> = {
  alternance: "Alternance",
  stage: "Stage",
};

export default async function PublicOffersIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const { page: pageParam, type: typeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const type = typeParam === "alternance" || typeParam === "stage" ? typeParam : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("offers")
    .select("id, title, company, location, contract_type, sector, published_at", {
      count: "exact",
    })
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (type) query = query.eq("contract_type", type);

  const { data: offers, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres d&apos;alternance et de stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        {count ?? 0} offre(s) active(s). Crée un compte pour matcher automatiquement les tiennes.
      </p>

      <div className="seg mt-5">
        <Link href="/offres" className={`seg-opt${!type ? " is-active" : ""}`}>
          Toutes
        </Link>
        <Link href="/offres?type=alternance" className={`seg-opt${type === "alternance" ? " is-active" : ""}`}>
          Alternance
        </Link>
        <Link href="/offres?type=stage" className={`seg-opt${type === "stage" ? " is-active" : ""}`}>
          Stage
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(offers ?? []).map((offer) => (
          <Link key={offer.id} href={offerPath(offer)} className="card elev-sm">
            <span className="tag tag-accent">{CONTRACT_LABEL[offer.contract_type]}</span>
            <h2 className="card-title mt-2">{offer.title}</h2>
            <p className="card-body">
              {offer.company} — {offer.location}
            </p>
          </Link>
        ))}
      </div>

      {(offers ?? []).length === 0 && (
        <p style={{ fontSize: 14, marginTop: 24 }}>Aucune offre active pour le moment.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/offres?page=${p}${type ? `&type=${type}` : ""}`}
              className={`btn btn-secondary btn-icon${p === page ? " is-active" : ""}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
