import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFranceTravailStream } from "@/lib/franceTravail/sync";
import { deactivateNonPlacementOffers } from "@/lib/offers/deactivateNonPlacements";

// Sync périodique (voir vercel.json) : ramène des offres alternance/stage
// depuis l'API officielle France Travail (gratuite, volume très supérieur à
// Adzuna) -- ajoutée le 28/09 pour dépasser 10 000 offres actives (demande
// de Nathan). Même structure que sync-adzuna/route.ts : un "stream" par
// mot-clé, exécutés en parallèle, upsert dans "offers" (source=
// france_travail), désactivation des offres que France Travail ne montre
// plus (voir STALE_AFTER_HOURS).
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

// Offres disparues de France Travail : la synchro de nuit par département
// (0 h 10 à 3 h 40 UTC) revoit toutes les offres en ligne, chaque nuit
// (24/10 : 8 tranches sur 8 complètes, aucune recherche tronquée). Une
// offre absente de la dernière nuit n'est plus en ligne : retirée au bout de
// STALE_AFTER_HOURS (10 jours jusqu'au 24/10, d'où des offres « en cours
// d'actualisation » chez France Travail encore montrées). Si la dernière
// nuit est incomplète (moins de MIN_SEEN_SHARE des offres revues), on attend
// une deuxième nuit manquée ; et jamais plus de MAX_DEACTIVATE_SHARE du
// catalogue d'un coup (synchro de nuit en panne).
const STALE_AFTER_HOURS = 20;
const STALE_AFTER_HOURS_SAFE = 44;
const MIN_SEEN_SHARE = 0.85;
const MAX_DEACTIVATE_SHARE = 0.3;

async function countFranceTravail(admin: ReturnType<typeof createAdminClient>, filter: { seenAfter?: string; seenBefore?: string }) {
  let q = admin.from("offers").select("id", { count: "exact", head: true }).eq("source", "france_travail").eq("is_active", true);
  if (filter.seenAfter) q = q.gte("last_seen_at", filter.seenAfter);
  if (filter.seenBefore) q = q.lt("last_seen_at", filter.seenBefore);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function deactivateStaleFranceTravail(admin: ReturnType<typeof createAdminClient>, now: number) {
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();
  // Offres en ligne il y a deux nuits, et part revue la nuit dernière.
  const [aliveTwoNightsAgo, seenLastNight, active] = await Promise.all([
    countFranceTravail(admin, { seenAfter: iso(STALE_AFTER_HOURS_SAFE) }),
    countFranceTravail(admin, { seenAfter: iso(STALE_AFTER_HOURS) }),
    countFranceTravail(admin, {}),
  ]);
  const seenShare = aliveTwoNightsAgo > 0 ? seenLastNight / aliveTwoNightsAgo : 0;
  const staleHours = seenShare >= MIN_SEEN_SHARE ? STALE_AFTER_HOURS : STALE_AFTER_HOURS_SAFE;
  const candidates = await countFranceTravail(admin, { seenBefore: iso(staleHours) });
  const stats = { active, seenShare: Math.round(seenShare * 100) / 100, staleHours, candidates };
  if (active === 0 || candidates / active > MAX_DEACTIVATE_SHARE) {
    return { ...stats, deactivated: 0, skipped: "trop d'offres d'un coup, synchro de nuit à vérifier" };
  }
  const { data, error } = await admin
    .from("offers")
    .update({ is_active: false })
    .eq("source", "france_travail")
    .eq("is_active", true)
    .lt("last_seen_at", iso(staleHours))
    .select("id");
  if (error) throw new Error(error.message);
  return { ...stats, deactivated: data?.length ?? 0, skipped: null };
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
    QUERIES.map((what) => runFranceTravailStream(admin, syncStartedAt, what)),
  );

  const fetched = streamResults.reduce((sum, r) => sum + r.fetched, 0);
  const mapped = streamResults.reduce((sum, r) => sum + r.mapped, 0);
  const upserted = streamResults.reduce((sum, r) => sum + r.upserted, 0);
  const errors = streamResults.flatMap((r) => r.errors);

  const stale = await deactivateStaleFranceTravail(admin, Date.now()).catch((err: unknown) => {
    errors.push(`deactivate: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  });
  if (stale?.skipped) console.error("sync-france-travail: désactivation suspendue", JSON.stringify(stale));

  // Postes qui ne sont ni des alternances ni des stages, importés avant une
  // règle de classifyContract.ts (France Travail et Adzuna).
  const nonPlacements = await deactivateNonPlacementOffers(admin);
  if (nonPlacements.error) errors.push(`non-placements: ${nonPlacements.error}`);

  const summary = {
    fetched,
    mapped,
    upserted,
    deactivated: stale?.deactivated ?? 0,
    stale,
    nonPlacementsDeactivated: nonPlacements.deactivated,
  };
  console.log(`sync-france-travail: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`sync-france-travail errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
