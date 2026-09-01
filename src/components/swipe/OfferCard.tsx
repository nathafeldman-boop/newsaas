import type { Offer } from "@/types/database";

export function OfferCardContent({ offer }: { offer: Offer }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
        </span>
        {offer.sector && (
          <span className="text-xs text-foreground/50">{offer.sector}</span>
        )}
      </div>

      <h2 className="mt-4 text-2xl font-bold leading-tight">{offer.title}</h2>
      <p className="mt-1 text-foreground/70">
        {offer.company} · {offer.location}
      </p>

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
            📍 {offer.remote_policy}
          </span>
        )}
      </div>
    </div>
  );
}
