import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Offer } from "@/types/database";
import { MIN_QUALITY_FOR_FEED } from "@/lib/offers/quality";
import { isSchoolAd } from "@/lib/seo/schools";

type Filters = {
  excludeIds?: string[];
  sectors?: string[];
  /** Ne renvoyer que les offres publiées APRÈS cette date ISO. */
  publishedAfter?: string;
  /** Ne renvoyer que les offres arrivées chez Stageio APRÈS cette date ISO (alertes e-mail). */
  createdAfter?: string;
  /** Ne renvoyer que les offres dont le lieu contient l'un de ces noms. */
  locations?: string[];
  /** Ne renvoyer que les offres dont l'intitulé contient l'un de ces motifs ILIKE (voir targetJobTitlePatterns). */
  titles?: string[];
  /**
   * Sans les annonces d'écoles (isSchoolAd) : abonnés (deck et e-mails).
   * Filtré en base par offers.is_school_ad quand la colonne existe, sinon
   * après lecture.
   */
  employersOnly?: boolean;
  limit?: number;
};

// Colonne offers.is_school_ad (SCHOOL_AD_COLUMN_SQL) pas encore créée en
// base : filtre après lecture seulement, et on la redemande toutes les
// 10 minutes (elle sert dès que le SQL est passé, sans redéploiement).
let schoolColumnMissingAt = 0;
const SCHOOL_COLUMN_RETRY_MS = 10 * 60_000;
const isMissingSchoolColumn = (error: { code?: string; message: string }) =>
  /is_school_ad/.test(error.message) && (error.code === "42703" || error.code === "PGRST204" || /does not exist|n'existe pas/i.test(error.message));

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
  const { excludeIds = [], sectors = [], publishedAfter, createdAfter, locations, titles, employersOnly = false, limit = 600 } = filters;
  const schoolFilter = employersOnly && Date.now() - schoolColumnMissingAt > SCHOOL_COLUMN_RETRY_MS;
  const keep = (rows: Offer[]) => (employersOnly ? rows.filter((o) => !isSchoolAd(o)) : rows);
  const locationOr = locations ? locationsFilter(locations) : null;
  if (locations && !locationOr) return [];
  // Motifs déjà propres (lettres, espaces, « _ ») : rien qui casse .or().
  const titleOr = titles ? titles.filter((t) => /^[a-z_ ]+$/i.test(t)).map((t) => `title.ilike.%${t}%`).join(",") : null;
  if (titles && !titleOr) return [];

  function baseQuery() {
    let q = supabase.from("offers").select("*").eq("is_active", true).limit(limit);
    if (excludeIds.length > 0) q = q.not("id", "in", `(${excludeIds.join(",")})`);
    if (sectors.length > 0) q = q.in("sector", sectors);
    if (publishedAfter) q = q.gt("published_at", publishedAfter);
    if (createdAfter) q = q.gt("created_at", createdAfter);
    if (locationOr) q = q.or(locationOr);
    // Deux .or() se combinent en ET : lieu ET intitulé.
    if (titleOr) q = q.or(titleOr);
    if (schoolFilter) q = q.eq("is_school_ad", false);
    return q;
  }

  const { data, error } = await baseQuery()
    .gte("quality_score", MIN_QUALITY_FOR_FEED)
    .order("quality_score", { ascending: false })
    .order("published_at", { ascending: false });

  if (!error) return keep(data ?? []);
  if (schoolFilter && isMissingSchoolColumn(error)) {
    schoolColumnMissingAt = Date.now();
    return fetchActiveOffers(supabase, filters);
  }

  // Délai dépassé (base chargée : 6 fois sur /swipe du 24/09 au 13/10) : le
  // repli d'origine abandonnait AUSSI le filtre qualité et servait les
  // offres les plus récentes, bonnes ou pas. On garde le filtre, on lit par
  // date (index existant, rapide) et on trie par qualité ici.
  const missingColumn = error.code === "42703" || /quality_score.*(does not exist|n'existe pas)/i.test(error.message);
  if (!missingColumn) {
    console.error("fetchActiveOffers: tri par qualité en échec, lecture par date avec filtre qualité", error);
    const { data: recent, error: recentError } = await baseQuery()
      .gte("quality_score", MIN_QUALITY_FOR_FEED)
      .order("published_at", { ascending: false });
    if (!recentError) {
      return keep([...(recent ?? [])].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0)));
    }
    console.error("fetchActiveOffers: lecture par date en échec aussi", recentError);
  }

  console.error(
    "fetchActiveOffers: requête avec quality_score en échec (migration pas encore appliquée ?), repli sans filtre qualité",
    error,
  );
  const { data: fallbackData } = await baseQuery().order("published_at", { ascending: false });
  return keep(fallbackData ?? []);
}
