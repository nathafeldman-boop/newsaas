import Link from "next/link";
import type { ApplicationStatus, Offer } from "@/types/database";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "📨 Candidature envoyée",
  en_cours: "📝 En cours",
  entretien: "💬 Entretien",
  acceptee: "✅ Acceptée",
  refusee: "❌ Refusée",
};

function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function OfferListCard({
  offer,
  applicationStatus,
  matchScore,
}: {
  offer: Offer;
  applicationStatus?: ApplicationStatus | null;
  matchScore?: number;
}) {
  const tags = [offer.salary, offer.remote_policy].filter((t): t is string => Boolean(t));

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        background: "var(--color-surface)",
        borderRadius: 22,
        padding: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            flexShrink: 0,
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          {companyInitials(offer.company)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            {offer.title}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            {offer.company} · {offer.location}
            {offer.source === "demo" && " · démo"}
          </p>
        </div>
        {typeof matchScore === "number" && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--color-accent-2-700)",
              background: "var(--color-accent-2-100)",
              padding: "4px 8px",
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            {matchScore}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="tag tag-accent" style={{ whiteSpace: "nowrap" }}>
          {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
        </span>
        {tags.map((tag) => (
          <span key={tag} className="tag tag-neutral">
            {tag}
          </span>
        ))}
      </div>

      <div
        className="flex items-center gap-2.5"
        style={{ paddingTop: 12, borderTop: "1px solid var(--color-divider)" }}
      >
        {applicationStatus ? (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-accent-700)" }}>
            {STATUS_LABELS[applicationStatus]}
          </span>
        ) : (
          <span style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            Pas encore postulé
          </span>
        )}
        <Link
          href={`/candidature/${offer.id}`}
          className="btn btn-primary"
          style={{ marginLeft: "auto", padding: "8px 16px", fontSize: 12.5, whiteSpace: "nowrap" }}
        >
          {applicationStatus ? "Voir" : "✈️ Postuler"}
        </Link>
      </div>
    </div>
  );
}
