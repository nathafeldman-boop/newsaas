import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream, type StreamResult } from "@/lib/franceTravail/sync";
import type { FranceTravailQuery } from "@/lib/franceTravail/client";

// CDI et CDD ouverts aux débutants (07/11 : « plus personne ne cherche
// d'alternance en ce moment », demande de Nathan). France Travail compte des
// centaines de milliers de CDI/CDD : on ne garde que les offres où moins
// d'un an d'expérience suffit, les plus récentes d'abord.
//
// - « full » (une fois par nuit) : chaque région métropolitaine, CDI puis
//   CDD, publiées depuis 14 jours (plafond de l'API : ~1 150 par recherche,
//   soit au plus ~30 000 offres).
// - « fresh » (toutes les heures) : France entière, publiées depuis 1 jour.
//
// Une offre CDI/CDD que ni l'une ni l'autre ne revoit pendant
// STALE_AFTER_DAYS est retirée (pourvue, trop ancienne ou sortie du
// plafond) : les synchros de nuit des alternances ne les revoient pas.

export type EmploisMode = "full" | "fresh";

const REGIONS = ["11", "24", "27", "28", "32", "44", "52", "53", "75", "76", "84", "93", "94"];
const TYPES = ["CDI", "CDD"];
const BASE: FranceTravailQuery = { experience: "1", sort: 1 };
const CONCURRENCY = 4;
const TIME_BUDGET_MS = 240_000;
export const STALE_AFTER_DAYS = 3;

export function emploisQueries(mode: EmploisMode): FranceTravailQuery[] {
  if (mode === "fresh") return TYPES.map((typeContrat) => ({ ...BASE, typeContrat, publieeDepuis: 1 }));
  return REGIONS.flatMap((region) => TYPES.map((typeContrat) => ({ ...BASE, typeContrat, region, publieeDepuis: 14 })));
}

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

async function deactivateStaleEmplois(admin: ReturnType<typeof createAdminClient>, now: number) {
  const { data, error } = await admin
    .from("offers")
    .update({ is_active: false })
    .eq("source", "france_travail")
    .eq("is_active", true)
    .in("contract_type", ["cdi", "cdd"])
    .lt("last_seen_at", new Date(now - STALE_AFTER_DAYS * 86_400_000).toISOString())
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function handleEmploisSync(request: NextRequest, mode: EmploisMode) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || !process.env.FRANCE_TRAVAIL_CLIENT_SECRET) {
    return NextResponse.json({ skipped: "FRANCE_TRAVAIL_CLIENT_ID/SECRET non configurés." });
  }

  const startedAt = Date.now();
  const syncStartedAt = new Date(startedAt).toISOString();
  const deadline = startedAt + TIME_BUDGET_MS;
  const admin = createAdminClient();

  const results: StreamResult[] = await runPool(emploisQueries(mode), CONCURRENCY, (query) =>
    runFranceTravailStream(admin, syncStartedAt, query, { deadline, emploi: true }),
  );
  const errors = results.flatMap((r) => r.errors);
  const truncated = results.filter((r) => r.truncated).length;

  // Retrait seulement après une passe complète, sans erreur ni coupure :
  // une nuit en panne ne vide pas le catalogue.
  let deactivated = 0;
  if (mode === "full" && truncated === 0 && errors.length === 0) {
    deactivated = await deactivateStaleEmplois(admin, startedAt).catch((err: unknown) => {
      errors.push(`deactivate: ${err instanceof Error ? err.message : String(err)}`);
      return 0;
    });
  }

  const summary = {
    mode,
    queries: results.length,
    fetched: results.reduce((sum, r) => sum + r.fetched, 0),
    mapped: results.reduce((sum, r) => sum + r.mapped, 0),
    upserted: results.reduce((sum, r) => sum + r.upserted, 0),
    capped: results.filter((r) => r.capped).length,
    truncated,
    deactivated,
  };
  console.log(`sync-france-travail-emplois: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-france-travail-emplois errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
