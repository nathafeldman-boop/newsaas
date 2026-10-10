import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Offer } from "@/types/database";
import { MIN_QUALITY_FOR_FEED } from "@/lib/offers/quality";

type Filters = {
  excludeIds?: string[];
  sectors?: string[];
  /** Ne renvoyer que les offres publiées APRÈS cette date ISO. */
  publishedAfter?: string;
  /** Ne renvoyer que les offres dont le lieu contient l'un de ces noms. */
  locations?: string[];
  limit?: number;
};

// Filtre PostgREST « lieu contient X ou Y » : la ville peut être saisie
// librement à l'onboarding, donc on retire ce qui casserait la syntaxe de
// .or() (virgule, parenthèses, guillemets) et les jokers de LIKE.
export function locationsFilter(locations: string[]): string | null {
  const parts = locations
    .map((l) => l.replace(/[,()"\\%*_]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 2)
    .map((l) => `location.ilike.%${l}%`);
  return parts.length > 0 ? parts.join(",") : null;
}

// Tente le filtre/tri par offers.quality_score ; si la colonne n'existe pas
// encore côté base (migration 20260925000000_retention_v2 pas encore
// appliquée en production au moment du déploiement de ce code -- voir
// RETENTION_AUDIT.md), retombe silencieusement sur le comportement
// STRICTEMENT identique à celui d'avant cette colonne plutôt que de
// renvoyer un deck vide à tout le monde. Le cœur du funnel (/swipe) ne doit
// JAMAIS dépendre d'une migration dont l'application en prod n'est pas
// garantie au moment où le code arrive -- règle absolue du produit
// ("ne pas casser le funnel actuel").
export async function fetchActiveOffers(
  supabase: SupabaseClient<Database>,
  filters: Filters,
): Promise<Offer[]> {
  const { excludeIds = [], sectors = [], publishedAfter, locations, limit = 600 } = filters;
  const locationOr = locations ? locationsFilter(locations) : null;
  if (locations && !locationOr) return [];

  function baseQuery() {
    let q = supabase.from("offers").select("*").eq("is_active", true).limit(limit);
    if (excludeIds.length > 0) q = q.not("id", "in", `(${excludeIds.join(",")})`);
    if (sectors.length > 0) q = q.in("sector", sectors);
    if (publishedAfter) q = q.gt("published_at", publishedAfter);
    if (locationOr) q = q.or(locationOr);
    return q;
  }

  const { data, error } = await baseQuery()
    .gte("quality_score", MIN_QUALITY_FOR_FEED)
    .order("quality_score", { ascending: false })
    .order("published_at", { ascending: false });

  if (!error) return data ?? [];

  console.error(
    "fetchActiveOffers: requête avec quality_score en échec (migration pas encore appliquée ?), repli sans filtre qualité",
    error,
  );
  const { data: fallbackData } = await baseQuery().order("published_at", { ascending: false });
  return fallbackData ?? [];
}
