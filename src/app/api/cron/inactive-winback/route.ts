import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyInactiveWinback } from "@/lib/resend/notifyInactiveWinback";
import { INACTIVE_WINBACK_EMAILS } from "@/lib/resend/inactiveWinbackContent";
import { isPremium } from "@/lib/subscription/isPremium";

export const maxDuration = 60;

// Campagne de relance ponctuelle (demandée le 2026-09-28, "toute la
// semaine") : une série de 7 emails, un par jour, pour les comptes GRATUITS
// inactifs -- jamais les Premium/lifetime, la relance n'a pas de sens pour
// eux. Même doctrine que send-swipe-relance/route.ts : étalée dans le temps
// (un cron quotidien fait naturellement "un email par run" via le compteur
// inactive_campaign_emails_sent) plutôt qu'un envoi massif d'un coup, et
// bornée aux comptes déjà inscrits au lancement (CAMPAIGN_CUTOFF) pour que
// la série ne se relance jamais de zéro sur un tout nouvel inscrit qui
// n'a, par définition, pas encore eu la chance d'être "inactif".
const DAILY_LIMIT = 500;
const CAMPAIGN_CUTOFF = "2026-09-28T00:00:00.000Z";

// "Inactif" : jamais revenu depuis l'inscription, ou pas revenu depuis 3
// jours -- voir (app)/layout.tsx pour last_active_at (retapé à chaque
// navigation authentifiée).
const INACTIVE_AFTER_DAYS = 3;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - INACTIVE_AFTER_DAYS);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, subscription_status, last_active_at, inactive_campaign_emails_sent, notify_new_offers")
    .lt("inactive_campaign_emails_sent", INACTIVE_WINBACK_EMAILS.length)
    .eq("notify_new_offers", true)
    .not("email", "is", null)
    .lte("created_at", CAMPAIGN_CUTOFF)
    .order("created_at", { ascending: true });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const candidates = (profiles ?? [])
    .filter((p) => !isPremium(p))
    .filter((p) => !p.last_active_at || new Date(p.last_active_at) < inactiveCutoff)
    .slice(0, DAILY_LIMIT);

  let emailed = 0;
  const errors: string[] = [];

  for (const profile of candidates) {
    if (!profile.email) continue;

    const dayIndex = profile.inactive_campaign_emails_sent;

    // Claim par compare-and-swap sur le compteur (au lieu d'un simple
    // .is(col, null) comme swipe_relance_sent_at, car ici la valeur avance
    // 0->7 plutôt que null->timestamp) : deux runs qui se chevauchent ne
    // peuvent jamais envoyer deux fois le même email de la série au même
    // compte.
    const { data: claimed, error: claimError } = await admin
      .from("profiles")
      .update({ inactive_campaign_emails_sent: dayIndex + 1 })
      .eq("id", profile.id)
      .eq("inactive_campaign_emails_sent", dayIndex)
      .select("id");

    if (claimError) {
      errors.push(`profile ${profile.id}: claim failed: ${claimError.message}`);
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    try {
      await notifyInactiveWinback(profile.email, profile.full_name, profile.id, dayIndex);
      emailed++;
    } catch (err) {
      errors.push(`profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
      // Envoi raté : on rend le compteur à sa valeur d'avant pour que le
      // prochain run retente CE MÊME email plutôt que de sauter au suivant
      // de la série.
      await admin.from("profiles").update({ inactive_campaign_emails_sent: dayIndex }).eq("id", profile.id);
    }
  }

  return NextResponse.json({ candidatesFound: candidates.length, emailed, errors });
}
