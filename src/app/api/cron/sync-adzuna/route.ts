import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchAdzunaPage } from "@/lib/adzuna/client";
import { mapAdzunaJob } from "@/lib/adzuna/mapOffer";
import { TOP_CITIES } from "@/lib/onboarding/options";

// Sync périodique (voir vercel.json) : ramène des offres alternance/stage
// depuis Adzuna par lots, upsert dans "offers" (source=adzuna), et désactive
// les offres adzuna qui n'ont pas été revues depuis 7 jours (probablement
// pourvues ou retirées — Adzuna ne fournit pas de statut "encore en ligne").
//
// Chaque annonce est classée alternance/stage par analyse du titre/texte
// (Adzuna est un agrégateur généraliste, pas de champ dédié pour les
// contrats français) ; celles qui ne correspondent clairement à aucun des
// deux sont ignorées plutôt que devinées.

export const maxDuration = 60;

// Volume pondéré plutôt qu'égal entre les deux requêtes : les alternances
// sont structurellement sous-représentées sur un agrégateur généraliste
// comme Adzuna (le mot "stage" apparaît dans énormément plus d'annonces
// -- stages courts, "stage" au sens formation, etc. -- que "alternance"),
// donc un nombre de pages égal produisait mécaniquement moins d'offres
// alternance que stage une fois classifyContractType appliqué. "apprentissage"
// est une requête à part entière (pas juste un synonyme dans le regex de
// classification) pour élargir le filet sur les annonces qui ne disent
// jamais littéralement "alternance".
const QUERIES: { what: string; pages: number; where?: string }[] = [
  { what: "alternance", pages: 4 },
  { what: "apprentissage", pages: 2 },
  { what: "stage", pages: 3 },
];
// Conservateur tant que le compte Adzuna est en plan "Trial Access" (quota
// limité, souvent quelques centaines d'appels/mois). 11 appels/jour au total
// (9 génériques ci-dessus + 2 ciblés ville ci-dessous) x 1 run/jour
// (vercel.json) = ~330/mois. Augmenter une fois le plan/quota réel connu
// (page "Stats" du dashboard Adzuna).

// Les requêtes génériques ci-dessus, sans filtre "where", sont classées par
// Adzuna par pertinence/date -- ce qui favorise mécaniquement l'Île-de-France
// où se concentre l'essentiel du volume d'offres. Résultat : un profil basé
// à Lyon ou Marseille voyait très peu d'offres réellement proches de lui.
// Plutôt que de multiplier chaque requête par les 12 métropoles de
// TOP_CITIES (dépasserait largement le quota), on cible une seule ville par
// jour à tour de rôle -- cycle complet tous les 12 jours -- avec le budget
// libéré par la réduction des requêtes génériques ci-dessus (5→4 et 3→2
// pages). Basé sur le nombre de jours depuis l'epoch plutôt que le jour du
// mois/de l'année : reste stable même si un run de cron est manqué, et ne
// dérive pas d'une année sur l'autre (365 n'est pas un multiple de 12).
const CITY_OF_THE_DAY = TOP_CITIES[Math.floor(Date.now() / 86_400_000) % TOP_CITIES.length];
const CITY_QUERIES: { what: string; pages: number; where: string }[] = [
  { what: "alternance", pages: 1, where: CITY_OF_THE_DAY },
  { what: "stage", pages: 1, where: CITY_OF_THE_DAY },
];

const STALE_AFTER_DAYS = 10;
// Filtre de sécurité en plus de max_days_old côté requête (searchAdzunaPage) :
// une annonce alternance/stage de plusieurs mois est presque certainement
// pourvue, on ne veut jamais la sauvegarder même si l'API la renvoie encore.
const MAX_PUBLISHED_AGE_DAYS = 30;

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

  let fetched = 0;
  let mapped = 0;
  let upserted = 0;
  const errors: string[] = [];

  for (const { what, pages, where } of [...QUERIES, ...CITY_QUERIES]) {
    for (let page = 1; page <= pages; page++) {
      let jobs;
      try {
        jobs = await searchAdzunaPage(what, page, where);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
        break; // page suivante inutile si celle-ci a échoué (ex: quota, auth)
      }

      if (jobs.length === 0) break; // plus de résultats pour cette requête
      fetched += jobs.length;

      const ageCutoff = new Date();
      ageCutoff.setDate(ageCutoff.getDate() - MAX_PUBLISHED_AGE_DAYS);

      const rows = jobs
        .map(mapAdzunaJob)
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .filter((o) => new Date(o.published_at) >= ageCutoff)
        .map((o) => ({ ...o, last_seen_at: syncStartedAt }));
      mapped += rows.length;

      if (rows.length > 0) {
        const { error } = await admin
          .from("offers")
          .upsert(rows, { onConflict: "source,external_id" });
        if (error) {
          errors.push(`upsert page ${page} (${what}): ${error.message}`);
        } else {
          upserted += rows.length;
        }
      }
    }
  }

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
    cityOfTheDay: CITY_OF_THE_DAY,
    errors,
  });
}
