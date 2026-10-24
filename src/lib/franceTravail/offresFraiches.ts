import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream, type StreamResult } from "@/lib/franceTravail/sync";
import type { FranceTravailQuery } from "@/lib/franceTravail/client";

// Offres fraîches (Nathan, 24/10 : « les offres d'alternance ou de stage
// sont très vite épuisées, il faut les toutes dernières »). La synchro de
// nuit par département revoit tout le catalogue une fois par jour : une
// offre publiée à 9 h n'arrivait chez nous que la nuit suivante. Ici,
// chaque heure, les offres créées dans les WINDOW_HOURS dernières heures,
// France entière (le volume tient sous le plafond de 1 150 résultats par
// recherche). Fenêtre plus large que l'intervalle : un passage manqué est
// rattrapé par le suivant, et l'upsert ne crée jamais de doublon.

const WINDOW_HOURS = 3;
const TIME_BUDGET_MS = 45_000;

// Format attendu par l'API : sans millisecondes.
function ftDate(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function syncFreshFranceTravailOffers(now: number = Date.now()) {
  const window = { minCreationDate: ftDate(now - WINDOW_HOURS * 3600_000), maxCreationDate: ftDate(now) };
  const queries: { what: FranceTravailQuery; expectAlternance: boolean }[] = [
    { what: { natureContrat: "E2,FS", ...window }, expectAlternance: true },
    { what: { motsCles: "alternance", ...window }, expectAlternance: false },
    { what: { motsCles: "apprentissage", ...window }, expectAlternance: false },
    { what: { motsCles: "stage", ...window }, expectAlternance: false },
  ];
  const admin = createAdminClient();
  const syncStartedAt = new Date(now).toISOString();
  const deadline = now + TIME_BUDGET_MS;
  const results: StreamResult[] = await Promise.all(
    queries.map(({ what, expectAlternance }) => runFranceTravailStream(admin, syncStartedAt, what, { deadline, expectAlternance })),
  );

  // Nouvelles chez nous (pas seulement revues) : créées pendant ce passage.
  const { count: added } = await admin
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("source", "france_travail")
    .gte("created_at", syncStartedAt);

  return {
    window: `${window.minCreationDate} → ${window.maxCreationDate}`,
    fetched: results.reduce((sum, r) => sum + r.fetched, 0),
    upserted: results.reduce((sum, r) => sum + r.upserted, 0),
    added: added ?? null,
    capped: results.filter((r) => r.capped).length,
    truncated: results.filter((r) => r.truncated).length,
    errors: results.flatMap((r) => r.errors),
  };
}
