// Client pour l'API Adzuna (https://developer.adzuna.com) — agrégateur
// d'offres généraliste, utilisé ici pour sourcer à grande échelle les
// annonces alternance/stage en France. Auth simple par app_id/app_key en
// query string (pas d'OAuth), contrairement à l'API France Travail.

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/fr/search";
const RESULTS_PER_PAGE = 50;

export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string; tag?: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
}

interface AdzunaSearchResponse {
  results: AdzunaJob[];
  count: number;
}

// Alternance/stage sont des annonces à courte durée de vie : au-delà de ça,
// l'offre a de bonnes chances d'être déjà pourvue. Filtré ici côté requête
// (économise le quota Adzuna sur des résultats qu'on rejetterait de toute
// façon) ET revérifié après mapping dans le cron (sync-adzuna) au cas où
// max_days_old ne serait pas honoré à 100% par l'API.
const MAX_DAYS_OLD = 30;

export async function searchAdzunaPage(
  what: string,
  page: number,
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID / ADZUNA_APP_KEY non configurés.");
  }

  const url = new URL(`${BASE_URL}/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("what", what);
  url.searchParams.set("results_per_page", String(RESULTS_PER_PAGE));
  url.searchParams.set("sort_by", "date");
  url.searchParams.set("max_days_old", String(MAX_DAYS_OLD));
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Adzuna HTTP ${res.status} (page ${page}, what="${what}") : ${body.slice(0, 300)}`,
    );
  }

  const json = (await res.json()) as AdzunaSearchResponse;
  return json.results ?? [];
}
