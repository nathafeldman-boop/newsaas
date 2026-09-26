import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchAdzunaPage } from "@/lib/adzuna/client";
import { mapAdzunaJob } from "@/lib/adzuna/mapOffer";
import { TOP_CITIES } from "@/lib/onboarding/options";
import { computeOfferFingerprint } from "@/lib/offers/fingerprint";
import { computeOfferQualityScore } from "@/lib/offers/quality";

// Sync périodique (voir vercel.json) : ramène des offres alternance/stage
// depuis Adzuna par lots, upsert dans "offers" (source=adzuna), et désactive
// les offres adzuna qui n'ont pas été revues depuis STALE_AFTER_DAYS jours
// (probablement pourvues ou retirées — Adzuna ne fournit pas de statut
// "encore en ligne").
//
// Chaque annonce est classée alternance/stage par analyse du titre/texte
// (Adzuna est un agrégateur généraliste, pas de champ dédié pour les
// contrats français) ; celles qui ne correspondent clairement à aucun des
// deux sont ignorées plutôt que devinées.

export const maxDuration = 60;

// Volume poussé au maximum raisonnable le 26/09 (demande explicite de
// Nathan : "rajoute des milliers d'offres", puis "fait le maximum" --
// catalogue trop vite épuisé sous le hard paywall, la navigation n'est plus
// rationnée par un quota, voir RETENTION_AUDIT.md). Chaque page = 50
// résultats bruts (RESULTS_PER_PAGE côté client Adzuna), avant
// classification/qualité/dédup -- le volume net réellement ajouté au
// catalogue est plus bas, mais ce paramètre est le levier direct pour
// l'augmenter. Pondéré comme avant entre les 3 requêtes : "stage" est
// structurellement sur-représenté sur un agrégateur généraliste,
// "alternance"/"apprentissage" ont besoin de plus de profondeur pour un
// volume net comparable une fois classifyContractType appliqué. Chaque
// requête s'arrête d'elle-même dès qu'une page ne renvoie plus rien (voir
// runStream ci-dessous) : monter ces plafonds ne gaspille jamais d'appels
// une fois le vrai stock de résultats Adzuna épuisé pour une requête donnée.
//
// ATTENTION quota Adzuna : ce compte était en plan "Trial Access", quota
// limité d'après la doc Adzuna (souvent quelques centaines d'appels/mois) --
// ce volume (~130 appels/jour, voir plus bas) le dépasse largement, sciemment
// (demande explicite "fait le maximum"). Le code dégrade sans planter si
// Adzuna répond 429/403 (voir runStream ci-dessous, une erreur par page
// n'interrompt que cette page/requête, jamais tout le run) : au pire, le
// volume plafonne à ce que le quota réel permet plutôt que de continuer à
// grimper. Vérifier la page "Stats" du dashboard Adzuna pour voir où ça
// plafonne réellement, et passer sur un plan payant si ce volume doit tenir
// dans la durée plutôt que produire un pic initial puis retomber.
const QUERIES: { what: string; pages: number; where?: string }[] = [
  { what: "alternance", pages: 25 },
  { what: "apprentissage", pages: 15 },
  { what: "stage", pages: 20 },
];

// Les requêtes génériques ci-dessus, sans filtre "where", sont classées par
// Adzuna par pertinence/date -- ce qui favorise mécaniquement l'Île-de-France
// où se concentre l'essentiel du volume d'offres. Résultat : un profil basé
// à Lyon ou Marseille voyait très peu d'offres réellement proches de lui.
// Couvre désormais LES 12 VILLES de TOP_CITIES à chaque run (plus de
// rotation nécessaire au niveau "maximum") -- chaque ville, chaque stream
// tournant en parallèle des autres (voir Promise.all plus bas), ne coûte
// donc rien en temps d'exécution, seulement en appels Adzuna.
const CITY_PAGES_PER_QUERY = 3;
const CITIES_OF_THE_RUN = TOP_CITIES;
const CITY_QUERIES: { what: string; pages: number; where: string }[] = CITIES_OF_THE_RUN.flatMap(
  (city) => [
    { what: "alternance", pages: CITY_PAGES_PER_QUERY, where: city },
    { what: "stage", pages: CITY_PAGES_PER_QUERY, where: city },
  ],
);
// Total : (25+15+20) + 12 villes x 2 requêtes x 3 pages = 60 + 72 = 132
// appels Adzuna par run, x1 run/jour (vercel.json) = ~3960/mois. Le plus
// long stream individuel (alternance générique, 25 pages séquentielles)
// reste largement dans le budget maxDuration=60s ; les 12 villes tournent
// toutes en parallèle du reste, donc n'allongent jamais ce temps.

const STALE_AFTER_DAYS = 10;
// Filtre de sécurité en plus de max_days_old côté requête (searchAdzunaPage) :
// une annonce alternance/stage de plusieurs mois est presque certainement
// pourvue, on ne veut jamais la sauvegarder même si l'API la renvoie encore.
const MAX_PUBLISHED_AGE_DAYS = 30;

type StreamResult = { fetched: number; mapped: number; upserted: number; errors: string[] };

// Une requête (what/pages/where) = un "stream" indépendant, exécuté en
// parallèle des autres (voir Promise.all plus bas) -- pages payload lâchées
// dans le budget maxDuration=60s (plafond Vercel Hobby) : à ce volume,
// tout enchaîner séquentiellement (comme avant le 26/09) dépasserait
// largement 60s et perdrait tout le run, offres déjà upsert comprises côté
// requêtes suivantes jamais atteintes. Même correctif déjà appliqué à
// /api/cron/discover-offers pour la même raison. La pagination À L'INTÉRIEUR
// d'un stream reste séquentielle (page N+1 dépend de savoir si N a renvoyé
// des résultats) ; c'est l'exécution ENTRE streams qui devient concurrente.
async function runStream(
  admin: ReturnType<typeof createAdminClient>,
  syncStartedAt: string,
  what: string,
  pages: number,
  where?: string,
): Promise<StreamResult> {
  let fetched = 0;
  let mapped = 0;
  let upserted = 0;
  const errors: string[] = [];

  const ageCutoff = new Date();
  ageCutoff.setDate(ageCutoff.getDate() - MAX_PUBLISHED_AGE_DAYS);

  for (let page = 1; page <= pages; page++) {
    let jobs;
    try {
      jobs = await searchAdzunaPage(what, page, where);
    } catch (err) {
      errors.push(
        `${what}${where ? ` @ ${where}` : ""} page ${page}: ${err instanceof Error ? err.message : String(err)}`,
      );
      break; // page suivante inutile si celle-ci a échoué (ex: quota, auth)
    }

    if (jobs.length === 0) break; // plus de résultats pour cette requête
    fetched += jobs.length;

    const rows = jobs
      .map(mapAdzunaJob)
      .filter((o): o is NonNullable<typeof o> => o !== null)
      .filter((o) => new Date(o.published_at) >= ageCutoff)
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
        errors.push(`upsert ${what}${where ? ` @ ${where}` : ""} page ${page}: ${error.message}`);
      } else {
        upserted += rows.length;
      }
    }
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

  const syncStartedAt = new Date().toISOString();
  const admin = createAdminClient();

  const streamResults = await Promise.all(
    [...QUERIES, ...CITY_QUERIES].map(({ what, pages, where }) =>
      runStream(admin, syncStartedAt, what, pages, where),
    ),
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
    .eq("source", "adzuna")
    .eq("is_active", true)
    .lt("last_seen_at", staleCutoff.toISOString())
    .select("id");

  if (deactivateError) errors.push(`deactivate: ${deactivateError.message}`);

  return NextResponse.json({
    fetched,
    mapped,
    upserted,
    deactivated: deactivated?.length ?? 0,
    citiesOfTheRun: CITIES_OF_THE_RUN,
    errors,
  });
}
