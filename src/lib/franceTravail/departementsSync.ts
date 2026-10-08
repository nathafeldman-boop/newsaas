import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream, type StreamResult } from "@/lib/franceTravail/sync";
import { DEPARTEMENTS } from "@/lib/seo/departements";

// Synchro France Travail par département, en SLICES tranches (voir
// app/api/cron/sync-france-travail-departements). L'API plafonne chaque
// recherche à ~1 150 résultats : la recherche nationale "alternance" ne
// ramenait qu'environ 1 000 offres d'alternance (07/10), d'où la même
// recherche découpée par département. 101 départements ne tiennent pas dans
// une exécution (3 appels par seconde max, voir client.ts) : chaque
// exécution traite un huitième des départements.
//
// Alternance : recherche par nature de contrat (apprentissage +
// professionnalisation) plutôt que par mots-clés. Le 08/10, le Nord comptait
// environ 1 000 offres d'alternance sur candidat.francetravail.fr (filtre
// natureOffre=E2,FS) contre 244 chez nous : les mots-clés « alternance » et
// « apprentissage » ratent les annonces qui ne les écrivent pas, et se
// recoupent. Repli sur les mots-clés pour un département si le filtre ne
// marche pas (voir runFranceTravailStream, expectAlternance) ou si le
// plafond de l'API est atteint.

export const SLICES = 8;

const ALTERNANCE_BY_NATURE = { natureContrat: "E2,FS" };
const ALTERNANCE_KEYWORDS = ["alternance", "apprentissage"];
const STAGE_KEYWORDS = ["stage"];
const CONCURRENCY = 4;
// Marge avant le maxDuration de 60 s : les streams en cours s'arrêtent
// proprement à la page suivante.
const TIME_BUDGET_MS = 45_000;

async function runPool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      results.push(await worker(item));
    }
  });
  await Promise.all(lanes);
  return results;
}

export function departementsOfSlice(slice: number): string[] {
  return DEPARTEMENTS.filter((_, i) => i % SLICES === slice).map((d) => d.code);
}

export async function handleDepartementsSync(request: NextRequest, slice: number) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || !process.env.FRANCE_TRAVAIL_CLIENT_SECRET) {
    return NextResponse.json({ skipped: "FRANCE_TRAVAIL_CLIENT_ID/SECRET non configurés." });
  }

  const startedAt = Date.now();
  const departements = departementsOfSlice(slice);
  const syncStartedAt = new Date(startedAt).toISOString();
  const admin = createAdminClient();
  const deadline = startedAt + TIME_BUDGET_MS;

  // Trois passes, la plus utile d'abord : si le temps manque, ce sont les
  // recherches secondaires qui sautent.
  // 1. Alternance par nature de contrat, dans tous les départements.
  const natureResults = await runPool(departements, CONCURRENCY, async (departement) => ({
    departement,
    result: await runFranceTravailStream(admin, syncStartedAt, ALTERNANCE_BY_NATURE, { departement, deadline, expectAlternance: true }),
  }));
  // 2. Mots-clés d'alternance, seulement là où le filtre n'a pas marché ou a
  // atteint le plafond de l'API.
  const fallbackDepartements = natureResults
    .filter(({ result }) => result.ineffective || result.capped)
    .map(({ departement }) => departement);
  const keywordTasks = [
    ...ALTERNANCE_KEYWORDS.flatMap((what) => fallbackDepartements.map((departement) => ({ what, departement }))),
    // 3. Stages, partout.
    ...STAGE_KEYWORDS.flatMap((what) => departements.map((departement) => ({ what, departement }))),
  ];
  const keywordResults: StreamResult[] = await runPool(keywordTasks, CONCURRENCY, ({ what, departement }) =>
    runFranceTravailStream(admin, syncStartedAt, what, { departement, deadline }),
  );
  const results = [...natureResults.map(({ result }) => result), ...keywordResults];
  const plannedStreams = departements.length + keywordTasks.length;

  const summary = {
    slice,
    departements: departements.join(","),
    fetched: results.reduce((sum, r) => sum + r.fetched, 0),
    mapped: results.reduce((sum, r) => sum + r.mapped, 0),
    upserted: results.reduce((sum, r) => sum + r.upserted, 0),
    // Alternance par nature de contrat : offres ramenées, et départements
    // repassés aux mots-clés (filtre inefficace ou plafond atteint).
    natureMapped: natureResults.reduce((sum, { result }) => sum + result.mapped, 0),
    natureIneffective: natureResults.filter(({ result }) => result.ineffective).length,
    natureCapped: natureResults.filter(({ result }) => result.capped).length,
    // Recherches pas terminées faute de temps : à surveiller (réduire la
    // tranche si ce nombre reste élevé).
    truncated: results.filter((r) => r.truncated).length + (plannedStreams - results.length),
    seconds: Math.round((Date.now() - startedAt) / 1000),
  };
  const errors = results.flatMap((r) => r.errors);
  console.log(`sync-france-travail-departements: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-france-travail-departements errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
