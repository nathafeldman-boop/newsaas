import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function LogoPlaceholder({ company }: { company: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "var(--color-accent-100)",
        color: "var(--color-accent-700)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-heading)",
        fontSize: 17,
        flexShrink: 0,
      }}
    >
      {company.charAt(0).toUpperCase()}
    </div>
  );
}

export function OfferCardContent({
  offer,
  matchScore,
}: {
  offer: Offer;
  matchScore?: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div style={{ padding: "26px 26px 0" }} className="flex flex-col">
        <div className="flex items-center gap-3">
          <LogoPlaceholder company={offer.company} />
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <span className="tag tag-accent" style={{ whiteSpace: "nowrap" }}>
              {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
            </span>
            {typeof matchScore === "number" && (
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 15,
                  color: "var(--color-accent-2-700)",
                  whiteSpace: "nowrap",
                }}
              >
                ★ {matchScore}% compatible
              </span>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: 24, lineHeight: 1.2, margin: "16px 0 0" }}>{offer.title}</h2>
        <p
          style={{
            fontSize: 14,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
            margin: "4px 0 0",
          }}
        >
          {offer.company} · {offer.location}
          {offer.start_date && ` · dès ${formatStartDate(offer.start_date)}`}
        </p>
        {offer.education_level && (
          <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
            🎓 {offer.education_level}
          </p>
        )}

        <p
          className="flex-1 overflow-y-auto"
          style={{
            margin: "16px 0 0",
            fontSize: 13.5,
            lineHeight: 1.6,
            color: "color-mix(in srgb, var(--color-text) 80%, transparent)",
          }}
        >
          {offer.description}
        </p>
      </div>

      <div style={{ padding: "20px 26px 26px" }} className="flex flex-wrap gap-2">
        {offer.duration && (
          <span className="tag tag-neutral" style={{ whiteSpace: "nowrap" }}>
            {offer.duration}
          </span>
        )}
        {offer.salary && (
          <span className="tag tag-neutral" style={{ whiteSpace: "nowrap" }}>
            {offer.salary}
          </span>
        )}
        {offer.remote_policy && (
          <span className="tag tag-neutral" style={{ whiteSpace: "nowrap" }}>
            {offer.remote_policy}
          </span>
        )}
      </div>
    </div>
  );
}
