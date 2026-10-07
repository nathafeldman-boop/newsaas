import { getProgrammaticIndex, type ProgrammaticIndex, type SegmentStats } from "@/lib/seo/programmaticIndex";
import { getMetier, isFormation } from "@/lib/seo/metiers";
import type { ContractType } from "@/types/database";

// Données du baromètre en CSV (une ligne par type de contrat x métier /
// ville / région) : à réutiliser librement avec un lien vers
// /barometre-alternance-stage. Mêmes chiffres que la page, recalculés
// chaque heure ; CDN 1 h.
export const dynamic = "force-dynamic";

const MAX_CITIES = 200;

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rows(type: ContractType, index: ProgrammaticIndex): (string | number | null)[][] {
  const line = (dimension: string, slug: string, label: string, stats: SegmentStats) => [
    index.generatedAt.slice(0, 10),
    type,
    dimension,
    slug,
    label,
    stats.count,
    index.total > 0 ? Math.round((stats.count / index.total) * 1000) / 10 : 0,
    stats.recent7d,
    stats.salaryMedian,
    stats.salaryN,
  ];
  return [
    ...Object.values(index.metiers)
      .filter((m) => !isFormation(m.slug))
      .sort((a, b) => b.count - a.count)
      .map((m) => line("metier", m.slug, getMetier(m.slug)?.label ?? m.slug, m)),
    ...Object.values(index.metiers)
      .filter((m) => isFormation(m.slug))
      .sort((a, b) => b.count - a.count)
      .map((m) => line("diplome", m.slug, getMetier(m.slug)?.label ?? m.slug, m)),
    ...Object.values(index.regions)
      .sort((a, b) => b.count - a.count)
      .map((r) => line("region", r.slug, r.label, r)),
    ...Object.values(index.cities)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CITIES)
      .map((c) => line("ville", c.slug, c.label, c)),
  ];
}

export async function GET() {
  const [alternance, stage] = await Promise.all([getProgrammaticIndex("alternance"), getProgrammaticIndex("stage")]);
  const header = ["date", "contrat", "dimension", "slug", "libelle", "offres_actives", "part_pct", "publiees_7_jours", "salaire_median_brut_mensuel", "nb_offres_avec_salaire"];
  const body = [header, ...rows("alternance", alternance), ...rows("stage", stage)].map((row) => row.map(csvCell).join(",")).join("\n");
  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="barometre-stageio-alternance-stage.csv"',
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
