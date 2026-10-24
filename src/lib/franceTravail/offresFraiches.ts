import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream, type StreamResult } from "@/lib/franceTravail/sync";
import type { FranceTravailQuery } from "@/lib/franceTravail/client";

// Offres fraîches (Nathan, 24/10 : « les offres d'alternance ou de stage
// sont très vite épuisées, il faut les toutes dernières »). La synchro de
// nuit par département revoit tout le catalogue une fois par jour : une
// offre publiée à 9 h n'arrivait chez nous que la nuit suivante. Ici,
// chaque minute (Vercel Pro), les offres créées dans les WINDOW_MINUTES
// dernières minutes, France entière. Fenêtre plus large que l'intervalle :
// des passages manqués sont rattrapés par les suivants, l'upsert ne crée
// jamais de doublon, et la synchro de nuit rattrape le reste.

const WINDOW_MINUTES = 15;
const TIME_BUDGET_MS = 40_000;

// Format attendu par l'API : sans millisecondes.
function ftDate(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function syncFreshFranceTravailOffers(now: number = Date.now()) {
  const window = { minCreationDate: ftDate(now - WINDOW_MINUTES * 60_000), maxCreationDate: ftDate(now) };
  // Pas de contrôle « filtre efficace » (expectAlternance) : sur quelques
  // offres en première page, il écarterait la page à tort ; le filtre E2/FS
  // est vérifié chaque nuit (natureIneffective à 0).
  const queries: FranceTravailQuery[] = [
    { natureContrat: "E2,FS", ...window },
    { motsCles: "alternance", ...window },
    { motsCles: "apprentissage", ...window },
    { motsCles: "stage", ...window },
  ];
  const admin = createAdminClient();
  const syncStartedAt = new Date(now).toISOString();
  const deadline = now + TIME_BUDGET_MS;
  const results: StreamResult[] = await Promise.all(
    queries.map((what) => runFranceTravailStream(admin, syncStartedAt, what, { deadline, collectIds: true })),
  );

  // Nouvelles chez nous (pas seulement revues) : créées pendant ce passage.
  // Lu sur les offres de ce passage seulement (index unique source +
  // external_id), jamais un comptage de toute la table chaque minute.
  const ids = [...new Set(results.flatMap((r) => r.ids))];
  let added = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin
      .from("offers")
      .select("created_at")
      .eq("source", "france_travail")
      .in("external_id", ids.slice(i, i + 200));
    added += (data ?? []).filter((o) => Date.parse(o.created_at) >= now).length;
  }

  return {
    window: `${window.minCreationDate} → ${window.maxCreationDate}`,
    fetched: results.reduce((sum, r) => sum + r.fetched, 0),
    upserted: results.reduce((sum, r) => sum + r.upserted, 0),
    added,
    capped: results.filter((r) => r.capped).length,
    truncated: results.filter((r) => r.truncated).length,
    errors: results.flatMap((r) => r.errors),
  };
}
