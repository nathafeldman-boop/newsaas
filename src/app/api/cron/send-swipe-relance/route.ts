import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySwipeRelance } from "@/lib/resend/notifySwipeRelance";

export const maxDuration = 60;

// Campagne de relance ponctuelle (demandée le 2026-09-07) : tous les
// inscrits qui ont déjà swipé au moins une offre, mais étalée à
// DAILY_LIMIT emails/jour plutôt qu'un envoi massif d'un coup -- limite le
// risque de passer pour du spam et laisse le temps de réagir si le taux
// de désabonnement grimpe.
//
// CAMPAIGN_CUTOFF borne la campagne aux comptes déjà inscrits au moment du
// lancement : un nouvel inscrit qui swipe pour la première fois après
// cette date ne sera jamais happé par cette relance, même si ce cron
// reste dans vercel.json après la semaine -- pas besoin de retirer
// l'entrée en urgence une fois le stock de destinataires épuisé, il ne
// fera plus jamais rien après ça.
const DAILY_LIMIT = 100;
const CAMPAIGN_CUTOFF = "2026-09-08T00:00:00.000Z";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const { data: swipeRows, error: swipesError } = await admin.from("swipes").select("user_id");
  if (swipesError) {
    return NextResponse.json({ error: swipesError.message }, { status: 500 });
  }
  const swipedUserIds = new Set((swipeRows ?? []).map((r) => r.user_id));

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, created_at")
    .is("swipe_relance_sent_at", null)
    .not("email", "is", null)
    .lte("created_at", CAMPAIGN_CUTOFF)
    .order("created_at", { ascending: true });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const candidates = (profiles ?? [])
    .filter((p) => swipedUserIds.has(p.id))
    .slice(0, DAILY_LIMIT);

  let emailed = 0;
  const errors: string[] = [];

  for (const profile of candidates) {
    if (!profile.email) continue;

    // Marque le compte "pris" avant d'envoyer (UPDATE conditionnel, comme
    // sendWeeklyOfferAnnouncementAction) : une exécution qui chevauche la
    // précédente (retry manuel pendant qu'un run cron traîne encore) ne
    // peut jamais doublonner l'envoi sur le même compte.
    const { data: claimed, error: claimError } = await admin
      .from("profiles")
      .update({ swipe_relance_sent_at: new Date().toISOString() })
      .eq("id", profile.id)
      .is("swipe_relance_sent_at", null)
      .select("id");

    if (claimError) {
      errors.push(`profile ${profile.id}: claim failed: ${claimError.message}`);
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    try {
      await notifySwipeRelance(profile.email, profile.full_name);
      emailed++;
    } catch (err) {
      errors.push(`profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      // L'envoi a échoué mais la marque est déjà posée -- on la relâche
      // pour qu'un prochain run retente ce compte plutôt que de le
      // considérer relancé à tort.
      await admin.from("profiles").update({ swipe_relance_sent_at: null }).eq("id", profile.id);
    }
  }

  return NextResponse.json({ candidatesFound: candidates.length, emailed, errors });
}
