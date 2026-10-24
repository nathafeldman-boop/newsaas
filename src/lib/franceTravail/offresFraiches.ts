import { createAdminClient } from "@/lib/supabase/admin";
import { toOfferRows } from "@/lib/franceTravail/sync";
import {
  searchFranceTravailPage,
  PAGE_SIZE,
  MAX_RANGE_END,
  type FranceTravailJob,
  type FranceTravailQuery,
} from "@/lib/franceTravail/client";

// Offres fraîches (Nathan, 24/10 : « les offres d'alternance ou de stage
// sont très vite épuisées, il faut les toutes dernières »). La synchro de
// nuit par département revoit tout le catalogue une fois par jour : une
// offre publiée à 9 h n'arrivait chez nous que la nuit suivante. Ici,
// chaque minute (Vercel Pro), les offres créées dans les WINDOW_HOURS
// dernières heures, France entière, et on n'enregistre que celles qu'on n'a
// pas encore. Fenêtre de 3 h et pas de quelques minutes : une offre peut
// apparaître dans l'API un moment après sa date de création, elle serait
// sinon ratée jusqu'à la nuit (le 24/10 à 12 h 55, 88 nouvelles sur 3 h).

const WINDOW_HOURS = 3;
const TIME_BUDGET_MS = 40_000;

// Format attendu par l'API : sans millisecondes.
function ftDate(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function fetchAll(what: FranceTravailQuery, deadline: number): Promise<{ jobs: FranceTravailJob[]; capped: boolean }> {
  const jobs: FranceTravailJob[] = [];
  for (let start = 0; start <= MAX_RANGE_END; start += PAGE_SIZE) {
    if (Date.now() > deadline) break;
    const end = Math.min(start + PAGE_SIZE - 1, MAX_RANGE_END);
    const page = await searchFranceTravailPage(what, start, end);
    jobs.push(...page.jobs);
    if (page.jobs.length < end - start + 1) return { jobs, capped: false };
  }
  return { jobs, capped: true };
}

export async function syncFreshFranceTravailOffers(now: number = Date.now()) {
  const window = { minCreationDate: ftDate(now - WINDOW_HOURS * 3600_000), maxCreationDate: ftDate(now) };
  const queries: FranceTravailQuery[] = [
    { natureContrat: "E2,FS", ...window },
    { motsCles: "alternance", ...window },
    { motsCles: "apprentissage", ...window },
    { motsCles: "stage", ...window },
  ];
  const deadline = now + TIME_BUDGET_MS;
  const errors: string[] = [];
  const settled = await Promise.allSettled(queries.map((what) => fetchAll(what, deadline)));
  const byId = new Map<string, FranceTravailJob>();
  let capped = 0;
  for (const r of settled) {
    if (r.status === "rejected") {
      errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
      continue;
    }
    if (r.value.capped) capped++;
    for (const job of r.value.jobs) if (job.id) byId.set(job.id, job);
  }

  // Seulement les offres pas encore en base : les autres sont revues par la
  // synchro de nuit, inutile de les réécrire chaque minute.
  const admin = createAdminClient();
  const ids = [...byId.keys()];
  const known = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await admin
      .from("offers")
      .select("external_id")
      .eq("source", "france_travail")
      .in("external_id", ids.slice(i, i + 200));
    if (error) {
      errors.push(`lecture: ${error.message}`);
      return { fetched: ids.length, added: 0, capped, errors };
    }
    for (const o of data ?? []) if (o.external_id) known.add(o.external_id);
  }
  const rows = toOfferRows(
    ids.filter((id) => !known.has(id)).map((id) => byId.get(id)!),
    new Date(now).toISOString(),
  );
  if (rows.length > 0) {
    const { error } = await admin.from("offers").upsert(rows, { onConflict: "source,external_id" });
    if (error) {
      errors.push(`upsert: ${error.message}`);
      return { fetched: ids.length, added: 0, capped, errors };
    }
  }
  return { fetched: ids.length, added: rows.length, capped, errors };
}
