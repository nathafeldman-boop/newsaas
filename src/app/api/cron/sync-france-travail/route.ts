import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchFranceTravailPage, PAGE_SIZE, MAX_RANGE_END } from "@/lib/franceTravail/client";
import { mapFranceTravailJob } from "@/lib/franceTravail/mapOffer";
import { computeOfferFingerprint } from "@/lib/offers/fingerprint";
import { computeOfferQualityScore } from "@/lib/offers/quality";

// Sync périodique (voir vercel.json) : ramène des offres alternance/stage
// depuis l'API officielle France Travail (gratuite, volume très supérieur à
// Adzuna) -- ajoutée le 28/09 pour dépasser 10 000 offres actives (demande
// de Nathan). Même structure que sync-adzuna/route.ts : un "stream" par
// mot-clé, exécutés en parallèle, upsert dans "offers" (source=
// france_travail), désactivation des offres pas revues depuis
// STALE_AFTER_DAYS jours.
//
// Nécessite FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET (voir
// .env.example) -- Nathan doit créer un compte sur francetravail.io et
// souscrire son application à "Offres d'emploi v2" avant que ce cron
// fonctionne. Le mapping des champs de réponse n'a pas pu être vérifié
// contre un vrai appel depuis ce sandbox (francetravail.io bloqué par le
// proxy réseau ici) -- vérifier le champ "errors" de la réponse JSON de ce
// endpoint après le premier vrai run.

export const maxDuration = 60;

const QUERIES = ["alternance", "apprentissage", "stage"];

// Plafond documenté de l'API par combinaison de mots-clés (voir client.ts) :
// au-delà, il faudrait segmenter par ville/département pour aller chercher
// plus (pas fait ici, faute de pouvoir vérifier le paramètre de filtre
// géographique exact depuis ce sandbox -- voir le commentaire dans
// client.ts). Le catalogue actif grossit malgré tout jour après jour : ce
// cron tourne quotidiennement et n'écrase jamais les offres déjà en base
// tant qu'elles restent vues (last_seen_at récent).
const MAX_PAGES_PER_QUERY = Math.ceil((MAX_RANGE_END + 1) / PAGE_SIZE);

const STALE_AFTER_DAYS = 10;

type StreamResult = { fetched: number; mapped: number; upserted: number; errors: string[] };

async function runStream(
  admin: ReturnType<typeof createAdminClient>,
  syncStartedAt: string,
  what: string,
): Promise<StreamResult> {
  let fetched = 0;
  let mapped = 0;
  let upserted = 0;
  const errors: string[] = [];

  for (let page = 0; page < MAX_PAGES_PER_QUERY; page++) {
    const rangeStart = page * PAGE_SIZE;
    const rangeEnd = Math.min(rangeStart + PAGE_SIZE - 1, MAX_RANGE_END);

    let jobs;
    try {
      const result = await searchFranceTravailPage(what, rangeStart, rangeEnd);
      jobs = result.jobs;
    } catch (err) {
      errors.push(`${what} range ${rangeStart}-${rangeEnd}: ${err instanceof Error ? err.message : String(err)}`);
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
      const { error } = await admin
        .from("offers")
        .upsert(rows, { onConflict: "source,external_id" });
      if (error) {
        errors.push(`upsert ${what} range ${rangeStart}-${rangeEnd}: ${error.message}`);
      } else {
        upserted += rows.length;
      }
    }

    if (jobs.length < PAGE_SIZE) break; // dernière page (résultats < taille demandée)
  }

  return { fetched, mapped, upserted, errors };
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
    // Jamais une erreur bruyante qui ferait échouer le cron Vercel tant que
    // Nathan n'a pas encore créé son compte francetravail.io -- juste ignoré.
    return NextResponse.json({ skipped: "FRANCE_TRAVAIL_CLIENT_ID/SECRET non configurés." });
  }

  const syncStartedAt = new Date().toISOString();
  const admin = createAdminClient();

  const streamResults = await Promise.all(
    QUERIES.map((what) => runStream(admin, syncStartedAt, what)),
  );

  const fetched = streamResults.reduce((sum, r) => sum + r.fetched, 0);
  const mapped = streamResults.reduce((sum, r) => sum + r.mapped, 0);
  const upserted = streamResults.reduce((sum, r) => sum + r.upserted, 0);
  const errors = streamResults.flatMap((r) => r.errors);

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - STALE_AFTER_DAYS);
  const { data: deactivated, error: deactivateError } = await admin
    .from("offers")
    .update({ is_active: false })
    .eq("source", "france_travail")
    .eq("is_active", true)
    .lt("last_seen_at", staleCutoff.toISOString())
    .select("id");

  if (deactivateError) errors.push(`deactivate: ${deactivateError.message}`);

  return NextResponse.json({
    fetched,
    mapped,
    upserted,
    deactivated: deactivated?.length ?? 0,
    errors,
  });
}
