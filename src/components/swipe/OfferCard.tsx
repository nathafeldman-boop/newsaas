import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function daysAgo(dateStr: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days === 0) return "Publiée aujourd'hui";
  if (days === 1) return "Publiée il y a 1 jour";
  return `Publiée il y a ${days} jours`;
}

export function MatchRing({ score }: { score: number }) {
  const size = 46;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-heading)",
          fontSize: 12,
          color: "#fff",
        }}
      >
        {score}%
      </span>
    </div>
  );
}

export function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-md)",
        padding: "8px 9px",
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "var(--color-accent-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 9.5,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 11.5,
            lineHeight: 1.25,
            fontFamily: "var(--font-heading)",
            margin: "1px 0 0",
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function OfferCardContent({
  offer,
  matchScore,
  reasons,
}: {
  offer: Offer;
  matchScore?: number;
  reasons?: string[];
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        style={{
          background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
          color: "#fff",
          padding: "22px 22px 42px",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, margin: 0 }}>{offer.company}</p>
            <p style={{ fontSize: 12, opacity: 0.85, margin: "2px 0 0" }}>{offer.location}</p>
          </div>
          {typeof matchScore === "number" && <MatchRing score={matchScore} />}
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.25, margin: "18px 0 0" }}>
          {offer.title}
        </h2>
        <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
          <span
            className="tag"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 11 }}
          >
            {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
          </span>
          <span style={{ fontSize: 11, opacity: 0.75 }}>{daysAgo(offer.published_at)}</span>
        </div>
      </div>

      <div style={{ padding: "0 18px", marginTop: -26, position: "relative", zIndex: 2 }}>
        <div className="grid grid-cols-3 gap-2">
          <StatPill icon="💶" label="Rémunération" value={offer.salary ?? "Non précisé"} />
          <StatPill icon="⏱" label="Durée" value={offer.duration ?? "Non précisé"} />
          <StatPill
            icon="📅"
            label="Début"
            value={offer.start_date ? formatStartDate(offer.start_date) : "Flexible"}
          />
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div style={{ padding: "16px 18px 0" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
              margin: 0,
            }}
          >
            Pourquoi toi
          </p>
          <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            {reasons.map((reason) => (
              <li key={reason} style={{ fontSize: 13, display: "flex", gap: 6 }}>
                <span aria-hidden style={{ color: "var(--color-accent-2-700)" }}>✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p
        className="flex-1 overflow-y-auto"
        style={{
          margin: "14px 0 0",
          padding: "0 18px 18px",
          fontSize: 13,
          lineHeight: 1.6,
          color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
        }}
      >
        {offer.description}
      </p>
    </div>
  );
}
