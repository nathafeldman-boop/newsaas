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

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  maxRows = 100_000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += POSTGREST_MAX_ROWS) {
    const { data, error } = await fetchPage(from, from + POSTGREST_MAX_ROWS - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < POSTGREST_MAX_ROWS) break;
  }
  return rows;
}
