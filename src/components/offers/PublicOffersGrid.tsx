import Link from "next/link";
import { offerPath } from "@/lib/offers/publicUrl";
import { pagedPath, pageWindow } from "@/lib/seo/pagination";
import type { PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import type { ContractType } from "@/types/database";

const CONTRACT_LABEL: Record<ContractType, string> = {
  alternance: "Alternance",
  stage: "Stage",
};

export function PublicOffersGrid({
  offers,
  page,
  totalPages,
  basePath,
}: {
  offers: PublicOfferRow[];
  page: number;
  totalPages: number;
  basePath: string;
}) {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {offers.map((offer) => (
          <Link key={offer.id} href={offerPath(offer)} className="card elev-sm">
            <span className="tag tag-accent">{CONTRACT_LABEL[offer.contract_type]}</span>
            <h2 className="card-title mt-2">{offer.title}</h2>
            <p className="card-body">
              {offer.company} — {offer.location}
            </p>
          </Link>
        ))}
      </div>

      {offers.length === 0 && (
        <p style={{ fontSize: 14, marginTop: 24 }}>Aucune offre active pour le moment.</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center gap-2">
          {page > 1 && (
            <Link href={pagedPath(basePath, page - 1)} className="btn btn-secondary" rel="prev">
              ← Précédente
            </Link>
          )}
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} aria-hidden style={{ padding: "0 4px" }}>
                …
              </span>
            ) : (
              <Link
                key={p}
                href={pagedPath(basePath, p)}
                className={`btn btn-secondary btn-icon${p === page ? " is-active" : ""}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages && (
            <Link href={pagedPath(basePath, page + 1)} className="btn btn-secondary" rel="next">
              Suivante →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
