import type { createAdminClient } from "@/lib/supabase/admin";
import {
  isStructuredAlternance,
  queryLabel,
  searchFranceTravailPage,
  PAGE_SIZE,
  MAX_RANGE_END,
  type FranceTravailQuery,
} from "@/lib/franceTravail/client";
import { mapFranceTravailJob } from "@/lib/franceTravail/mapOffer";
import { computeOfferFingerprint } from "@/lib/offers/fingerprint";
import { computeOfferQualityScore } from "@/lib/offers/quality";

// Un "stream" = une recherche France Travail (mot-clé, éventuellement
// limitée à un département) parcourue page par page jusqu'au plafond de
// l'API (~1 150 résultats), avec upsert dans "offers" (source=
// france_travail). Partagé par sync-france-travail (national) et
// sync-france-travail-departements.

const MAX_PAGES = Math.ceil((MAX_RANGE_END + 1) / PAGE_SIZE);

// `ineffective` : recherche par nature de contrat dont la première page ne
// ramène pas des offres d'alternance (filtre ignoré ou refusé par l'API) --
// l'appelant se rabat alors sur les mots-clés. `capped` : plafond de l'API
// atteint, il reste probablement des offres au-delà.
export type StreamResult = {
  fetched: number;
  mapped: number;
  upserted: number;
  errors: string[];
  truncated: boolean;
  ineffective?: boolean;
  capped?: boolean;
};

// Part minimale d'offres d'alternance (champs structurés) sur la première
// page pour considérer qu'un filtre natureContrat fonctionne.
const MIN_ALTERNANCE_SHARE = 0.8;

export async function runFranceTravailStream(
  admin: ReturnType<typeof createAdminClient>,
  syncStartedAt: string,
  what: string | FranceTravailQuery,
  options: { departement?: string; deadline?: number; expectAlternance?: boolean } = {},
): Promise<StreamResult> {
  let fetched = 0;
  let mapped = 0;
  let upserted = 0;
  const errors: string[] = [];
  const label = options.departement ? `${queryLabel(what)} (${options.departement})` : queryLabel(what);

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
      // Page suivante inutile si celle-ci a échoué (ex: quota, auth). Une
      // recherche par nature de contrat refusée dès la première page compte
      // comme inefficace : l'appelant repasse aux mots-clés.
      if (options.expectAlternance && page === 0) return { fetched, mapped, upserted, errors, truncated: false, ineffective: true };
      break;
    }

    if (jobs.length === 0) return { fetched, mapped, upserted, errors, truncated: false }; // plus de résultats
    if (options.expectAlternance && page === 0) {
      const share = jobs.filter(isStructuredAlternance).length / jobs.length;
      if (share < MIN_ALTERNANCE_SHARE) {
        errors.push(`${label}: ${Math.round(share * 100)} % d'offres d'alternance en première page, filtre ignoré, repli sur les mots-clés`);
        return { fetched, mapped, upserted, errors, truncated: false, ineffective: true };
      }
    }
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

    // Dernière page : moins de résultats que demandé (la fenêtre au plafond
    // de l'API est plus courte que PAGE_SIZE, d'où la taille demandée).
    if (jobs.length < rangeEnd - rangeStart + 1) return { fetched, mapped, upserted, errors, truncated: false };
  }

  // Toutes les pages pleines jusqu'au plafond de l'API (ou sortie sur
  // erreur : pas de plafond dans ce cas).
  return { fetched, mapped, upserted, errors, truncated: false, capped: errors.length === 0 && fetched > 0 };
}
