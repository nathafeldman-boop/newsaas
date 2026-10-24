import Link from "next/link";
import { refreshCockpitAction } from "@/app/admin/cockpit-actions";
import { PERIODS, dateTime, type PeriodDays } from "@/lib/admin/cockpit/format";

// Filtres en une ligne au-dessus de tout le contenu : la période s'applique
// à chaque chiffre et graphique de la page, comparée à la période
// précédente de même durée.
export function PeriodBar({
  path,
  period,
  computedAt,
  extraParams = {},
}: {
  path: string;
  period?: PeriodDays;
  computedAt: number | null;
  extraParams?: Record<string, string>;
}) {
  const href = (p: number) => {
    const qs = new URLSearchParams({ ...extraParams, p: String(p) });
    return `${path}?${qs.toString()}`;
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      {period ? (
        <div className="seg" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <Link key={p} href={href(p)} className={`seg-opt${p === period ? " is-active" : ""}`} style={{ padding: "7px 14px", fontSize: 13 }}>
              {p} jours
            </Link>
          ))}
        </div>
      ) : (
        <span />
      )}
      <form action={refreshCockpitAction} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--color-neutral-600)" }}>
        <span>Données Stripe du {dateTime(computedAt)}</span>
        <button type="submit" className="btn btn-secondary" style={{ padding: "5px 12px", fontSize: 12 }}>
          Actualiser
        </button>
      </form>
    </div>
  );
}
