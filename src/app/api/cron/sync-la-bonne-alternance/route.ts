import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lbaApiKey, searchLbaJobs, SEARCH_CALLS_PER_MINUTE } from "@/lib/laBonneAlternance/client";
import { mapLbaJob, type MappedLbaOffer } from "@/lib/laBonneAlternance/mapOffer";
import { DEPARTEMENTS } from "@/lib/seo/departements";
import { computeOfferFingerprint } from "@/lib/offers/fingerprint";
import { computeOfferQualityScore } from "@/lib/offers/quality";

// Synchro nocturne des offres La bonne alternance auxquelles l'API sait
// envoyer une candidature (voir lib/laBonneAlternance) : une recherche par
// département, à la cadence permise par l'API (60 appels par minute).
// Upsert sur (source, external_id) comme les autres sources ; les offres
// plus revues depuis STALE_AFTER_DAYS jours sont désactivées.
export const maxDuration = 300;

const STALE_AFTER_DAYS = 3;
const UPSERT_BATCH = 200;
// Bonus de qualité : sur ces offres, le like envoie vraiment la candidature.
// Elles passent donc devant dans le deck, et devant leur doublon France
// Travail au dédoublonnage (dedupe.ts garde la meilleure qualité).
const DIRECT_APPLY_BONUS = 10;
const TIME_BUDGET_MS = 240_000;
const CALL_INTERVAL_MS = Math.ceil(60_000 / SEARCH_CALLS_PER_MINUTE) + 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!lbaApiKey()) return NextResponse.json({ skipped: "LBA_API_KEY non configuré." });

  const startedAt = Date.now();
  const seenAt = new Date(startedAt).toISOString();
  const admin = createAdminClient();
  const errors: string[] = [];
  const byExternalId = new Map<string, MappedLbaOffer>();
  let fetched = 0;
  let searched = 0;

  for (const { code } of DEPARTEMENTS) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    const callStartedAt = Date.now();
    try {
      const jobs = await searchLbaJobs(code);
      fetched += jobs.length;
      for (const job of jobs) {
        const offer = mapLbaJob(job, code, seenAt);
        if (offer) byExternalId.set(offer.external_id, offer);
      }
      searched += 1;
    } catch (err) {
      errors.push(`${code}: ${err instanceof Error ? err.message : String(err)}`);
      // Jeton refusé : inutile d'insister sur les autres départements.
      if (/HTTP 40[13]/.test(String(err))) break;
    }
    await sleep(Math.max(0, CALL_INTERVAL_MS - (Date.now() - callStartedAt)));
  }

  const rows = [...byExternalId.values()].map((offer) => ({
    ...offer,
    last_seen_at: seenAt,
    content_fingerprint: computeOfferFingerprint(offer.title, offer.company),
    quality_score: Math.min(100, computeOfferQualityScore(offer) + DIRECT_APPLY_BONUS),
  }));
  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const { error } = await admin.from("offers").upsert(rows.slice(i, i + UPSERT_BATCH), { onConflict: "source,external_id" });
    if (error) errors.push(`upsert ${i}: ${error.message}`);
    else upserted += Math.min(UPSERT_BATCH, rows.length - i);
  }

  // Désactivation seulement après un passage presque complet : une panne de
  // l'API ne doit pas vider le deck de ces offres.
  let deactivated = 0;
  if (searched >= DEPARTEMENTS.length * 0.9) {
    const staleCutoff = new Date(startedAt - STALE_AFTER_DAYS * 86_400_000).toISOString();
    const { data, error } = await admin
      .from("offers")
      .update({ is_active: false })
      .eq("source", "la_bonne_alternance")
      .eq("is_active", true)
      .lt("last_seen_at", staleCutoff)
      .select("id");
    if (error) errors.push(`deactivate: ${error.message}`);
    deactivated = data?.length ?? 0;
  }

  const summary = {
    departements: searched,
    fetched,
    mapped: rows.length,
    upserted,
    deactivated,
    seconds: Math.round((Date.now() - startedAt) / 1000),
  };
  console.log(`sync-la-bonne-alternance: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-la-bonne-alternance errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
