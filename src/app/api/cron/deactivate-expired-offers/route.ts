import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dedupeActiveOffers } from "@/lib/offers/dedupe";
import { OFFER_EXPIRY_DAYS, OFFER_UNSEEN_GRACE_DAYS } from "@/lib/offers/expiry";
import { verifyUnseenFranceTravailOffers } from "@/lib/offers/staleCheck";

// Cron quotidien (voir vercel.json) : désactive les offres ingérées qui
// traînent depuis trop longtemps sans avoir été retraitées (probablement
// pourvues ou expirées). Les offres de démo ne sont jamais désactivées.
// Déclenché par Vercel Cron, qui envoie automatiquement
// "Authorization: Bearer $CRON_SECRET" quand cette variable est définie.
//
// Fait aussi office de nettoyage des doublons cross-source (voir
// RETENTION_AUDIT.md, "déduplication" et src/lib/offers/dedupe.ts) : cette
// même tâche d'hygiène du catalogue est le point naturel pour ça, plutôt que
// d'ajouter un cron dédié.
//
// Et (30/10) : les offres France Travail que la synchro ne revoit plus sont
// vérifiées auprès de leur API, et retirées si elles n'existent plus, sans
// attendre leurs 30 jours (voir lib/offers/staleCheck.ts).

export const maxDuration = 300;


export async function GET(request: NextRequest) {
  const started = Date.now();
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OFFER_EXPIRY_DAYS);
  // Encore montrée par sa source ces derniers jours = encore ouverte : on la
  // garde (voir OFFER_UNSEEN_GRACE_DAYS).
  const unseenCutoff = new Date();
  unseenCutoff.setDate(unseenCutoff.getDate() - OFFER_UNSEEN_GRACE_DAYS);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .update({ is_active: false })
    .neq("source", "demo")
    .eq("is_active", true)
    .lt("published_at", cutoff.toISOString())
    .lt("last_seen_at", unseenCutoff.toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dedupeResult = await dedupeActiveOffers(admin);

  let franceTravail: Awaited<ReturnType<typeof verifyUnseenFranceTravailOffers>> | { error: string };
  try {
    franceTravail = await verifyUnseenFranceTravailOffers(admin, started + 260_000);
  } catch (err) {
    franceTravail = { error: err instanceof Error ? err.message : String(err) };
  }
  console.log("deactivate-expired-offers", JSON.stringify({ deactivated: data?.length ?? 0, franceTravail }));

  return NextResponse.json({
    deactivated: data?.length ?? 0,
    dedupe: dedupeResult,
    franceTravail,
  });
}
