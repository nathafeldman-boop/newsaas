import { unstable_cache } from "next/cache";
import { computeWeekdayAverages, periodStart, type Period } from "@/lib/admin/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { POSTGREST_MAX_ROWS } from "@/lib/supabase/public";

// Statistiques lourdes du tableau de bord, en cache. Depuis le 08/10 midi, /admin
// lisait TOUTES les visites de la période (jusqu'à 60 000 lignes) par pages
// de 1000 enchaînées l'une après l'autre : jusqu'à 60 allers-retours avec la
// base à chaque rafraîchissement, pour un seul graphique. Désormais :
// - la période est découpée en fenêtres (un jour, une heure pour
//   aujourd'hui) lues en parallèle, 6 à la fois : quelques allers-retours au
//   lieu de dizaines ;
// - le résultat (quelques nombres) est mis en cache : 15 min pour la
//   moyenne par jour de semaine, 2 min pour les sources du jour. Les
//   inscriptions, le revenu et le Premium restent lus en direct.

const CONCURRENCY = 6;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type Admin = ReturnType<typeof createAdminClient>;

// Visites de [from, to), par curseur sur created_at (index
// site_visits_created_at_idx). Deux visites à la même microseconde à la
// jonction de deux pages : l'une peut être sautée, négligeable ici.
async function readWindow<T extends { created_at: string }>(admin: Admin, columns: string, from: Date, to: Date): Promise<T[]> {
  const rows: T[] = [];
  let after: string | null = null;
  for (;;) {
    let query = admin.from("site_visits").select(columns).lt("created_at", to.toISOString());
    query = after ? query.gt("created_at", after) : query.gte("created_at", from.toISOString());
    const { data, error } = await query.order("created_at").limit(POSTGREST_MAX_ROWS);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < POSTGREST_MAX_ROWS) return rows;
    after = page[page.length - 1].created_at;
  }
}

export async function readVisits<T extends { created_at: string }>(columns: string, since: Date, until: Date, windowMs: number): Promise<T[]> {
  const admin = createAdminClient();
  const windows: [Date, Date][] = [];
  for (let start = since.getTime(); start < until.getTime(); start += windowMs) {
    windows.push([new Date(start), new Date(Math.min(start + windowMs, until.getTime()))]);
  }
  const results: T[][] = new Array(windows.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, windows.length) }, async () => {
      while (next < windows.length) {
        const i = next++;
        results[i] = await readWindow<T>(admin, columns, windows[i][0], windows[i][1]);
      }
    }),
  );
  return results.flat();
}

// "tout" est borné à 180 jours, comme le reste du tableau de bord.
const ALL_TIME_DAYS = 180;

export const getWeekdayAverages = unstable_cache(
  async (period: Period): Promise<number[]> => {
    const until = new Date();
    const since = periodStart(period) ?? new Date(until.getTime() - ALL_TIME_DAYS * DAY_MS);
    const visits = await readVisits<{ visitor_id: string; created_at: string }>("visitor_id, created_at", since, until, DAY_MS);
    return computeWeekdayAverages(visits);
  },
  ["admin-weekday-averages-v1"],
  { revalidate: 900 },
);

// Visiteurs distincts du jour par source (utm_source), du plus gros au plus petit.
export const getTodayVisitorsBySource = unstable_cache(
  async (todayStartIso: string, unknownLabel: string): Promise<[string, number][]> => {
    const visits = await readVisits<{ visitor_id: string; utm_source: string | null; created_at: string }>(
      "visitor_id, utm_source, created_at",
      new Date(todayStartIso),
      new Date(),
      HOUR_MS,
    );
    const bySource = new Map<string, Set<string>>();
    for (const v of visits) {
      const source = v.utm_source || unknownLabel;
      if (!bySource.has(source)) bySource.set(source, new Set());
      bySource.get(source)!.add(v.visitor_id);
    }
    return [...bySource.entries()].map(([source, visitors]): [string, number] => [source, visitors.size]).sort((a, b) => b[1] - a[1]);
  },
  ["admin-today-visitors-by-source-v1"],
  { revalidate: 120 },
);

// Entonnoir d'onboarding : la fonction SQL filtre user_events sur event_type
// sans index adapté (index proposé dans SEO_ROADMAP.md) et a déjà dépassé le
// délai de la base. En cache 10 min ; une erreur n'est jamais mise en cache
// (exception levée), le tableau de bord réessaie au chargement suivant.
export const getOnboardingFunnelStats = unstable_cache(
  async (): Promise<{ step: string | null; viewed_count: number; completed_count: number }[]> => {
    const { data, error } = await createAdminClient().rpc("onboarding_funnel_stats");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["admin-onboarding-funnel-v1"],
  { revalidate: 600 },
);
