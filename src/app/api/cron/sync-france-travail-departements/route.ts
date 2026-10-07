import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream, type StreamResult } from "@/lib/franceTravail/sync";
import { DEPARTEMENTS } from "@/lib/seo/departements";

// Complément de sync-france-travail : l'API plafonne chaque recherche à
// ~1 150 résultats, donc la recherche nationale "alternance" ne ramenait
// qu'environ 1 000 offres d'alternance sur toutes celles publiées (07/10).
// Ici, même recherche découpée par département. 101 départements x 3 mots-
// clés ne tiennent pas dans une exécution : chaque exécution traite une
// tranche (SLICES tranches, RUNS_PER_DAY exécutions par jour), donc chaque département est revu tous les
// SLICES / RUNS_PER_DAY jours, bien avant la désactivation des offres pas
// revues depuis 10 jours (faite par sync-france-travail).

export const maxDuration = 60;

const QUERIES = ["alternance", "apprentissage", "stage"];
const SLICES = 6;
const RUNS_PER_DAY = 2;
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

export async function GET(request: NextRequest) {
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
  // Deux exécutions par jour (2 h et 3 h UTC, voir vercel.json ; sur le plan
  // Hobby, un cron part dans l'heure prévue) : l'heure dit laquelle.
  const run = new Date(startedAt).getUTCHours() % RUNS_PER_DAY;
  const day = Math.floor(startedAt / 86_400_000);
  const slice = (day * RUNS_PER_DAY + run) % SLICES;
  const departements = DEPARTEMENTS.filter((_, i) => i % SLICES === slice).map((d) => d.code);
  const tasks = departements.flatMap((departement) => QUERIES.map((what) => ({ what, departement })));

  const syncStartedAt = new Date(startedAt).toISOString();
  const admin = createAdminClient();
  const deadline = startedAt + TIME_BUDGET_MS;
  const results: StreamResult[] = await runPool(tasks, CONCURRENCY, ({ what, departement }) =>
    runFranceTravailStream(admin, syncStartedAt, what, { departement, deadline }),
  );

  const summary = {
    slice,
    departements: departements.join(","),
    fetched: results.reduce((sum, r) => sum + r.fetched, 0),
    mapped: results.reduce((sum, r) => sum + r.mapped, 0),
    upserted: results.reduce((sum, r) => sum + r.upserted, 0),
    // Recherches pas terminées faute de temps : à surveiller (réduire la
    // tranche si ce nombre reste élevé).
    truncated: results.filter((r) => r.truncated).length + (tasks.length - results.length),
    seconds: Math.round((Date.now() - startedAt) / 1000),
  };
  const errors = results.flatMap((r) => r.errors);
  console.log(`sync-france-travail-departements: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-france-travail-departements errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
