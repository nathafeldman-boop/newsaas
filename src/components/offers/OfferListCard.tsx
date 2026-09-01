import Link from "next/link";
import type { ApplicationStatus, Offer } from "@/types/database";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "Candidature envoyée",
  en_cours: "En cours",
  entretien: "Entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

export function OfferListCard({
  offer,
  applicationStatus,
}: {
  offer: Offer;
  applicationStatus?: ApplicationStatus | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
        </span>
        {offer.source === "demo" && (
          <span className="text-[10px] text-foreground/40">démo</span>
        )}
      </div>
      <h3 className="mt-3 font-bold leading-snug">{offer.title}</h3>
      <p className="mt-0.5 text-sm text-foreground/60">
        {offer.company} · {offer.location}
      </p>

      <div className="mt-4 flex items-center justify-between">
        {applicationStatus ? (
          <span className="text-xs font-medium text-brand-dark">
            {STATUS_LABELS[applicationStatus]}
          </span>
        ) : (
          <span className="text-xs text-foreground/40">Pas encore postulé</span>
        )}
        <Link
          href={`/candidature/${offer.id}`}
          className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          {applicationStatus ? "Voir" : "Postuler"}
        </Link>
      </div>
    </div>
  );
}
