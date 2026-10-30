import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parisClock } from "@/lib/campaigns/serieVente";
import { loadSearchingSubscribers } from "@/lib/subscribers/premiumProfiles";
import { runFollowUps } from "@/lib/subscribers/followUps";
import { runFreshAlerts } from "@/lib/subscribers/freshAlerts";
import { runAutoSpontaneous } from "@/lib/spontaneous/autoRun";
import { runWelcomeCatchUp } from "@/lib/subscribers/welcome";
import { FIRST_APPLICATION_HOUR, runFirstApplicationNudges } from "@/lib/subscribers/firstApplication";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { isMondayInParis, runWeeklyPlans, WEEKLY_PLAN_HOURS } from "@/lib/subscribers/weeklyPlan";
import { runRefundFollowUps } from "@/lib/refunds/process";

// Aide aux abonnés après le paiement (28/10, Nathan : « dès qu'il paye,
// fais pas en sorte qu'il churn […] faut qu'il trouve son alternance ») :
// un seul passage par heure de 8 h 15 à 19 h 15 (heure de Paris) :
// 1. relances des candidatures sans réponse, une fois par jour (10 h) ;
// 2. alerte « offre de moins d'une heure » (voir lib/subscribers/freshAlerts) ;
// 3. candidatures spontanées envoyées toutes seules pour Stageio Auto ;
// 4. (29/10, satisfaction) email d'accueil rattrapé si le webhook Stripe ne
//    l'a pas envoyé, et à 18 h « ta 1re candidature » pour les abonnés qui
//    n'ont encore rien envoyé le lendemain du paiement ;
// 5. (29/10) le lundi matin, « ton point du lundi » : chiffres de la
//    semaine, la priorité du moment et 5 offres (lib/subscribers/weeklyPlan).
// Chaque partie a son budget de temps : une panne de l'une ne bloque pas les autres.
export const maxDuration = 300;

const FOLLOW_UP_HOUR = 10;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const started = Date.now();
  const admin = createAdminClient();
  const { hour } = parisClock(started);
  const result: Record<string, unknown> = { parisHour: hour };

  let subscribers: Awaited<ReturnType<typeof loadSearchingSubscribers>> = [];
  try {
    subscribers = await loadSearchingSubscribers(admin);
    result.subscribers = subscribers.length;
  } catch (err) {
    result.subscribersError = err instanceof Error ? err.message : String(err);
  }

  if (subscribers.length > 0) {
    try {
      const r = await runWelcomeCatchUp(admin, subscribers, (p) => (isAutoTier(p) ? "auto" : "premium"), started + 30_000, started);
      result.welcome = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.welcomeError = err instanceof Error ? err.message : String(err);
    }
  }

  if (hour === FIRST_APPLICATION_HOUR && subscribers.length > 0) {
    try {
      const r = await runFirstApplicationNudges(admin, subscribers, isAutoTier, started + 75_000, started);
      result.firstApplication = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.firstApplicationError = err instanceof Error ? err.message : String(err);
    }
  }

  if (hour === FOLLOW_UP_HOUR && subscribers.length > 0) {
    try {
      const r = await runFollowUps(admin, subscribers, started);
      result.followUps = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.followUpsError = err instanceof Error ? err.message : String(err);
    }
  }

  if (subscribers.length > 0) {
    try {
      const r = await runFreshAlerts(admin, subscribers, started + 120_000, started);
      result.freshAlerts = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.freshAlertsError = err instanceof Error ? err.message : String(err);
    }
  }

  if (isMondayInParis(started) && WEEKLY_PLAN_HOURS.includes(hour) && subscribers.length > 0) {
    try {
      const r = await runWeeklyPlans(admin, subscribers, isAutoTier, started + 230_000, started);
      result.weeklyPlan = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.weeklyPlanError = err instanceof Error ? err.message : String(err);
    }
  }

  // Demandes de remboursement : réponse 20 jours après l'accusé (lib/refunds/process).
  if (hour === FOLLOW_UP_HOUR) {
    try {
      const r = await runRefundFollowUps(admin, started + 250_000, started);
      result.refundFollowUps = { ...r, failures: r.failures.slice(0, 5) };
    } catch (err) {
      result.refundFollowUpsError = err instanceof Error ? err.message : String(err);
    }
  }

  try {
    result.autoSpontaneous = await runAutoSpontaneous(admin, started + 270_000, started);
  } catch (err) {
    result.autoSpontaneousError = err instanceof Error ? err.message : String(err);
  }

  result.ms = Date.now() - started;
  console.log("abonnes", JSON.stringify(result));
  return NextResponse.json(result);
}
