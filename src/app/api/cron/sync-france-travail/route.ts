import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream } from "@/lib/franceTravail/sync";
import { deactivateNonPlacementOffers } from "@/lib/offers/deactivateNonPlacements";

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
//
// Recherche nationale plafonnée à ~1 150 résultats par mot-clé : le
// découpage par département est fait par sync-france-travail-departements.

export const maxDuration = 60;

const QUERIES = ["alternance", "apprentissage", "stage"];

const STALE_AFTER_DAYS = 10;

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
    QUERIES.map((what) => runFranceTravailStream(admin, syncStartedAt, what)),
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

  // Postes qui ne sont ni des alternances ni des stages, importés avant une
  // règle de classifyContract.ts (France Travail et Adzuna).
  const nonPlacements = await deactivateNonPlacementOffers(admin);
  if (nonPlacements.error) errors.push(`non-placements: ${nonPlacements.error}`);

  const summary = {
    fetched,
    mapped,
    upserted,
    deactivated: deactivated?.length ?? 0,
    nonPlacementsDeactivated: nonPlacements.deactivated,
  };
  console.log(`sync-france-travail: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-france-travail errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
