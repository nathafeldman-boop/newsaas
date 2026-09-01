import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function OfferCardContent({
  offer,
  matchScore,
}: {
  offer: Offer;
  matchScore?: number;
}) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
        </span>
        {typeof matchScore === "number" && (
          <span className="flex items-center gap-1 rounded-full bg-accent-like/10 px-3 py-1 text-xs font-bold text-accent-like">
            ⭐ {matchScore}% compatible
          </span>
        )}
      </div>

      <h2 className="mt-4 text-2xl font-bold leading-tight">{offer.title}</h2>

      <div className="mt-2 flex flex-col gap-1 text-sm text-foreground/70">
        <span>📍 {offer.location}</span>
        <span>🏢 {offer.company}</span>
        {offer.start_date && <span>📅 {formatStartDate(offer.start_date)}</span>}
        {offer.education_level && <span>🎓 {offer.education_level}</span>}
      </div>

      <p className="mt-4 flex-1 overflow-y-auto text-sm text-foreground/80 leading-relaxed">
        {offer.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/60">
        {offer.duration && (
          <span className="rounded-full border border-border px-2.5 py-1">
            ⏱ {offer.duration}
          </span>
        )}
        {offer.salary && (
          <span className="rounded-full border border-border px-2.5 py-1">
            💶 {offer.salary}
          </span>
        )}
        {offer.remote_policy && (
          <span className="rounded-full border border-border px-2.5 py-1">
            🏠 {offer.remote_policy}
          </span>
        )}
      </div>
    </div>
  );
}
