import { unstable_cache } from "next/cache";
import { computeWeekdayAverages, periodStart, type Period } from "@/lib/admin/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { POSTGREST_MAX_ROWS } from "@/lib/supabase/public";

// Statistiques lourdes du tableau de bord : bornées, en cache, et jamais
// bloquantes.
//
// Historique (08/10) : jusqu'à 12 h 10 UTC, le proxy écrivait une ligne
// site_visits pour chaque préchargement de lien (une cinquantaine par page
// vue). La table contient donc des millions de lignes avant cette heure-là.
// Lire « toutes les visites de la période » pour le graphique par jour de
// semaine a fait tomber /admin en délai dépassé (300 s) à 13 h puis à 18 h 21.
// Désormais :
// - on ne lit que les visites propres, depuis VISITS_CLEAN_SINCE ;
// - au plus MAX_ROWS lignes, en fenêtres (jour, ou heure pour aujourd'hui)
//   lues 6 à la fois ;
// - résultat en cache (15 min graphique, 2 min sources du jour) ;
// - et la page n'attend jamais plus de quelques secondes (withTimeout).
// Le vrai correctif est une fonction SQL d'agrégation (proposée dans
// SEO_ROADMAP.md, migration à valider par Nathan).

export const VISITS_CLEAN_SINCE = new Date("2026-10-08T12:15:00Z");

const CONCURRENCY = 6;
const MAX_ROWS = 100_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type Admin = ReturnType<typeof createAdminClient>;

// Visites de [from, to), par curseur sur created_at (index
// site_visits_created_at_idx). Deux visites à la même microseconde à la
// jonction de deux pages : l'une peut être sautée, négligeable ici.
async function readWindow<T extends { created_at: string }>(
  admin: Admin,
  columns: string,
  from: Date,
  to: Date,
  budget: { rows: number },
): Promise<T[]> {
  const rows: T[] = [];
  let after: string | null = null;
  while (budget.rows < MAX_ROWS) {
    let query = admin.from("site_visits").select(columns).lt("created_at", to.toISOString());
    query = after ? query.gt("created_at", after) : query.gte("created_at", from.toISOString());
    const { data, error } = await query.order("created_at").limit(POSTGREST_MAX_ROWS);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    budget.rows += page.length;
    if (page.length < POSTGREST_MAX_ROWS) break;
    after = page[page.length - 1].created_at;
  }
  return rows;
}

export async function readVisits<T extends { created_at: string }>(columns: string, since: Date, until: Date, windowMs: number): Promise<T[]> {
  const admin = createAdminClient();
  const start = Math.max(since.getTime(), VISITS_CLEAN_SINCE.getTime());
  const windows: [Date, Date][] = [];
  for (let t = start; t < until.getTime(); t += windowMs) {
    windows.push([new Date(t), new Date(Math.min(t + windowMs, until.getTime()))]);
  }
  const budget = { rows: 0 };
  const results: T[][] = new Array(windows.length).fill([]);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, windows.length) }, async () => {
      while (next < windows.length && budget.rows < MAX_ROWS) {
        const i = next++;
        results[i] = await readWindow<T>(admin, columns, windows[i][0], windows[i][1], budget);
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
  ["admin-weekday-averages-v2"],
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
  ["admin-today-visitors-by-source-v2"],
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

// Le tableau de bord n'attend jamais une statistique lourde plus de `ms` :
// au-delà, il s'affiche sans elle (timedOut) et le calcul continue tant que
// la fonction tourne, ce qui remplit le cache pour le chargement suivant.
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<{ value: T; timedOut: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ value: T; timedOut: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ value: fallback, timedOut: true }), ms);
  });
  try {
    return await Promise.race([promise.then((value) => ({ value, timedOut: false })), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
