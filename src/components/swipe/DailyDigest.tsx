import type { Offer } from "@/types/database";

export function DailyDigest({
  newTodayCount,
  topMatches,
}: {
  newTodayCount: number;
  topMatches: { offer: Offer; score: number }[];
}) {
  if (newTodayCount === 0 && topMatches.length === 0) return null;

  const excellentMatches = topMatches.filter((m) => m.score >= 85);

  return (
    <div className="mb-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-4">
      {newTodayCount > 0 && (
        <p className="text-sm font-semibold">
          🎯 {newTodayCount} nouvelle{newTodayCount > 1 ? "s" : ""} offre
          {newTodayCount > 1 ? "s" : ""} pour toi aujourd&apos;hui
        </p>
      )}
      {excellentMatches.length > 0 && (
        <>
          <p className="mt-1 text-xs text-foreground/60">
            {excellentMatches.length} excellente
            {excellentMatches.length > 1 ? "s" : ""} correspondance
            {excellentMatches.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-2 space-y-1">
            {topMatches.map(({ offer, score }) => (
              <li
                key={offer.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-foreground/70">{offer.title}</span>
                <span className="font-bold text-accent-like">{score}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
