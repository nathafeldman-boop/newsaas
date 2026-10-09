import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";
import type { Database } from "@/types/database";

// Client anonyme SANS cookies, pour les lectures publiques du catalogue
// (fiches offres, listes, sitemaps). Même clé anon et mêmes règles RLS que
// le client de server.ts, mais ne touche jamais à cookies() : les pages qui
// l'utilisent peuvent être mises en cache (ISR / unstable_cache) au lieu
// d'être recalculées et de rappeler Supabase à chaque visite de Googlebot.
// Jamais pour une donnée liée à un utilisateur connecté.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: fetchWithTimeout(10_000) } },
  );
}

// PostgREST plafonne chaque réponse à 1000 lignes (réglage "Max Rows" de
// Supabase), quel que soit le .limit() demandé : un .limit(45000) renvoie
// silencieusement 1000 lignes. Toute lecture qui doit couvrir le catalogue
// entier (sitemap, comptages par ville/secteur) doit donc paginer.
export const POSTGREST_MAX_ROWS = 1000;

// Pages lues par lots de `concurrency` en parallèle : à plusieurs dizaines
// de milliers d'offres (synchro France Travail par département), une lecture
// page par page prendrait plusieurs secondes à chaque recalcul d'index.
// Résultat identique à une lecture séquentielle (même ordre, arrêt à la
// première page incomplète).
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  maxRows = 100_000,
  concurrency = 4,
): Promise<T[]> {
  const rows: T[] = [];
  for (let batchStart = 0; batchStart < maxRows; batchStart += POSTGREST_MAX_ROWS * concurrency) {
    const starts: number[] = [];
    for (let from = batchStart; from < Math.min(maxRows, batchStart + POSTGREST_MAX_ROWS * concurrency); from += POSTGREST_MAX_ROWS) {
      starts.push(from);
    }
    const pages = await Promise.all(starts.map((from) => fetchPage(from, from + POSTGREST_MAX_ROWS - 1)));
    for (const { data, error } of pages) {
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return rows;
      rows.push(...data);
      if (data.length < POSTGREST_MAX_ROWS) return rows;
    }
  }
  return rows;
}

// Lecture complète du catalogue par curseur sur l'id (« les 1000 suivantes
// après tel id ») plutôt que par décalage : avec .range(9000, 9999), la base
// relit les 9000 premières lignes à chaque page, soit un coût qui croît
// avec le carré du catalogue -- c'est ce qui dépassait le délai du rôle anon
// au recalcul de l'index des pages (08/10, sans aucune synchro en cours).
// Ici chaque ligne n'est lue qu'une fois. Pages lues l'une après l'autre
// (chaque page dépend de la précédente) ; résultat trié par id.
// `fetchPage` doit appliquer ses filtres, puis le filtre id > afterId quand
// il est fourni, et trier par id croissant avec la limite donnée.
export async function fetchAllRowsByIdCursor<T extends { id: string }>(
  fetchPage: (afterId: string | null, limit: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  maxRows = 100_000,
): Promise<T[]> {
  const rows: T[] = [];
  let afterId: string | null = null;
  while (rows.length < maxRows) {
    const { data, error } = await fetchPage(afterId, Math.min(POSTGREST_MAX_ROWS, maxRows - rows.length));
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < POSTGREST_MAX_ROWS) break;
    afterId = data[data.length - 1].id;
  }
  return rows;
}

// Même ordre que .order("published_at", { ascending: false }).order("id")
// côté Postgres, pour les lectures par curseur qu'il faut ensuite trier du
// plus récent au plus ancien (les uuid en hexadécimal se comparent comme
// en base).
export function byPublishedDescThenId(a: { id: string; published_at: string | null }, b: { id: string; published_at: string | null }): number {
  const pa = a.published_at ?? "";
  const pb = b.published_at ?? "";
  if (pa !== pb) return pa < pb ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
