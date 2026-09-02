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
  matchScore,
}: {
  offer: Offer;
  applicationStatus?: ApplicationStatus | null;
  matchScore?: number;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {offer.company.charAt(0).toUpperCase()}
        </div>
        <span className="tag tag-accent ml-auto" style={{ whiteSpace: "nowrap" }}>
          {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
        </span>
      </div>
      <h3 className="card-title">{offer.title}</h3>
      <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
        {offer.company} · {offer.location}
        {offer.source === "demo" && " · démo"}
      </p>
      {typeof matchScore === "number" && (
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--color-accent-2-700)", margin: 0 }}>
          {matchScore}% compatible
        </p>
      )}
      {(offer.salary || offer.remote_policy) && (
        <p className="card-body">
          {[offer.salary, offer.remote_policy].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="flex items-center justify-between">
        {applicationStatus ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-accent-700)" }}>
            {STATUS_LABELS[applicationStatus]}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
            Pas encore postulé
          </span>
        )}
        <Link
          href={`/candidature/${offer.id}`}
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
        >
          {applicationStatus ? "Voir" : "Postuler"}
        </Link>
      </div>
    </div>
  );
}
