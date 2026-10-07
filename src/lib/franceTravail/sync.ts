import type { createAdminClient } from "@/lib/supabase/admin";
import { searchFranceTravailPage, PAGE_SIZE, MAX_RANGE_END } from "@/lib/franceTravail/client";
import { mapFranceTravailJob } from "@/lib/franceTravail/mapOffer";
import { computeOfferFingerprint } from "@/lib/offers/fingerprint";
import { computeOfferQualityScore } from "@/lib/offers/quality";

// Un "stream" = une recherche France Travail (mot-clé, éventuellement
// limitée à un département) parcourue page par page jusqu'au plafond de
// l'API (~1 150 résultats), avec upsert dans "offers" (source=
// france_travail). Partagé par sync-france-travail (national) et
// sync-france-travail-departements.

const MAX_PAGES = Math.ceil((MAX_RANGE_END + 1) / PAGE_SIZE);

export type StreamResult = { fetched: number; mapped: number; upserted: number; errors: string[]; truncated: boolean };

export async function runFranceTravailStream(
  admin: ReturnType<typeof createAdminClient>,
  syncStartedAt: string,
  what: string,
  options: { departement?: string; deadline?: number } = {},
): Promise<StreamResult> {
  let fetched = 0;
  let mapped = 0;
  let upserted = 0;
  const errors: string[] = [];
  const label = options.departement ? `${what} (${options.departement})` : what;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (options.deadline && Date.now() > options.deadline) return { fetched, mapped, upserted, errors, truncated: true };
    const rangeStart = page * PAGE_SIZE;
    const rangeEnd = Math.min(rangeStart + PAGE_SIZE - 1, MAX_RANGE_END);

    let jobs;
    try {
      const result = await searchFranceTravailPage(what, rangeStart, rangeEnd, options.departement);
      jobs = result.jobs;
    } catch (err) {
      errors.push(`${label} range ${rangeStart}-${rangeEnd}: ${err instanceof Error ? err.message : String(err)}`);
      break; // page suivante inutile si celle-ci a échoué (ex: quota, auth)
    }

    if (jobs.length === 0) break; // plus de résultats pour cette requête
    fetched += jobs.length;

    const rows = jobs
      .map(mapFranceTravailJob)
      .filter((o): o is NonNullable<typeof o> => o !== null)
      .map((o) => ({
        ...o,
        last_seen_at: syncStartedAt,
        content_fingerprint: computeOfferFingerprint(o.title, o.company),
        quality_score: computeOfferQualityScore(o),
      }));
    mapped += rows.length;

    if (rows.length > 0) {
      const { error } = await admin.from("offers").upsert(rows, { onConflict: "source,external_id" });
      if (error) {
        errors.push(`upsert ${label} range ${rangeStart}-${rangeEnd}: ${error.message}`);
      } else {
        upserted += rows.length;
      }
    }

    if (jobs.length < PAGE_SIZE) break; // dernière page (résultats < taille demandée)
  }

  return { fetched, mapped, upserted, errors, truncated: false };
}
