// Couleurs des graphiques du cockpit, validées avec le script de la
// méthode dataviz sur la surface des cartes (#f2f8f9) : vert Stageio et
// bleu passent toutes les vérifications (daltonisme compris) ; le rose
// (3e série) demande des libellés visibles ou le tableau, toujours fourni.
export const SERIES_COLORS = ["#0f9c56", "#2a78d6", "#e87ba4"] as const;
export const GRID_COLOR = "#dbe7ea";
export const AXIS_TEXT = "var(--color-neutral-600)";

export type ChartUnit = "eur" | "count";

export function formatValue(v: number, unit: ChartUnit): string {
  if (unit === "count") return v.toLocaleString("fr-FR");
  return `${(v / 100).toLocaleString("fr-FR", { minimumFractionDigits: Math.abs(v) < 100_000 ? 2 : 0, maximumFractionDigits: Math.abs(v) < 100_000 ? 2 : 0 })} €`;
}

/** Graduation compacte de l'axe : 0 / 50 € / 1,2 k€. */
export function formatTick(v: number, unit: ChartUnit): string {
  const n = unit === "eur" ? v / 100 : v;
  const s = Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k` : n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return unit === "eur" ? `${s} €` : s;
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short" });
export const dayLabel = (t: number) => dayFmt.format(t);
