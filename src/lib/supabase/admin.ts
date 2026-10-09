import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";
import type { Database } from "@/types/database";

// Client "service role" : bypass RLS. Ne JAMAIS importer depuis du code
// exécuté côté navigateur — réservé aux Route Handlers serveur (ex: ingestion Mistral).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant côté serveur.",
    );
  }

  // Délai du rôle service côté base : environ 8 s ; 20 s laissent la marge
  // d'une file d'attente sans bloquer une fonction pendant des minutes.
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithTimeout(20_000) },
  });
}
