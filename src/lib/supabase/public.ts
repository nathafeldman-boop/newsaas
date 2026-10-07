import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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
    { auth: { autoRefreshToken: false, persistSession: false } },
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
