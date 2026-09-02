import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchAdzunaPage } from "@/lib/adzuna/client";
import { mapAdzunaJob } from "@/lib/adzuna/mapOffer";

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

const QUERIES = ["alternance", "stage"] as const;
const PAGES_PER_QUERY = 6;
const STALE_AFTER_DAYS = 7;

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

  for (const what of QUERIES) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      let jobs;
      try {
        jobs = await searchAdzunaPage(what, page);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
        break; // page suivante inutile si celle-ci a échoué (ex: quota, auth)
      }

      if (jobs.length === 0) break; // plus de résultats pour cette requête
      fetched += jobs.length;

      const rows = jobs
        .map(mapAdzunaJob)
        .filter((o): o is NonNullable<typeof o> => o !== null)
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
    errors,
  });
}
