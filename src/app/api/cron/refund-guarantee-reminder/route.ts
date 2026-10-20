import { NextResponse, type NextRequest } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { getGuaranteeStatus } from "@/lib/premium/refundGuarantee";
import { GUARANTEE_MIN_LIKES, GUARANTEE_MONTHS, GUARANTEE_REMINDED_EVENT, formatParis } from "@/lib/premium/guaranteeTerms";
import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron quotidien (voir vercel.json) : rappel de la garantie remboursé la
// veille de l'ouverture de la fenêtre de 12 h (voir lib/premium/guaranteeTerms).
// Toute fenêtre qui s'ouvre dans les 36 h (ou déjà ouverte) et pas encore
// rappelée : un run manqué ne fait sauter personne. Un seul rappel par achat
// (événement refund_reminder_sent). Email de service lié à la garantie, pas
// une relance marketing : envoyé même aux comptes désabonnés des relances.

export const maxDuration = 60;

const TIME_BUDGET_MS = 45_000;
const LOOKAHEAD_MS = 36 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  // Achats dont les 3 mois tombent entre hier et après-demain.
  const from = new Date(startedAt - DAY_MS);
  from.setMonth(from.getMonth() - GUARANTEE_MONTHS);
  const to = new Date(startedAt + 2 * DAY_MS);
  to.setMonth(to.getMonth() - GUARANTEE_MONTHS);

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, subscription_status, premium_activated_at, total_paid_cents")
    .in("subscription_status", ["active", "lifetime"])
    .gt("total_paid_cents", 0)
    .gte("premium_activated_at", from.toISOString())
    .lte("premium_activated_at", to.toISOString())
    .not("email", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  let emailed = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    try {
      const status = await getGuaranteeStatus(profile.id, profile);
      if (!status || status.requestedAt) continue;
      if (status.closesAt.getTime() <= startedAt || status.opensAt.getTime() > startedAt + LOOKAHEAD_MS) continue;

      const { data: reminded, error: remindedError } = await admin
        .from("user_events")
        .select("id")
        .eq("user_id", profile.id)
        .eq("event_type", GUARANTEE_REMINDED_EVENT)
        .gte("created_at", profile.premium_activated_at!)
        .limit(1);
      if (remindedError) {
        errors.push(`profile ${profile.id}: ${remindedError.message}`);
        continue;
      }
      if (reminded?.length) continue;

      const missing = Math.max(0, GUARANTEE_MIN_LIKES - status.likes);
      await resend.emails.send({
        from: `Stageio <${fromEmail}>`,
        to: profile.email!,
        subject: "Ta garantie remboursé : ta fenêtre de demande arrive",
        html: `<p>Salut${profile.full_name ? ` ${profile.full_name}` : ""},</p>
<p>Tu as la garantie Stageio : si tu n'as obtenu aucun entretien après 3 mois de Premium, on te rembourse.</p>
<p><strong>Tu peux faire ta demande du ${formatParis(status.opensAt)} au ${formatParis(status.closesAt)} (heure de Paris)</strong>, depuis ta page Premium : <a href="${SITE_URL}/premium">${SITE_URL}/premium</a></p>
<p>Condition : au moins ${GUARANTEE_MIN_LIKES} offres likées pendant tes 3 mois. Tu en as ${status.likes}${
          missing > 0 && status.opensAt.getTime() > startedAt ? ` : il t'en manque ${missing}, tu as jusqu'au ${formatParis(status.opensAt)} pour les liker` : ""
        }.</p>
<p>Et si tu as décroché un entretien entre-temps, bravo, ne lâche rien 💪</p>`,
      });
      await logServerEvent(admin, profile.id, GUARANTEE_REMINDED_EVENT);
      emailed++;
    } catch (err) {
      errors.push(`profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const summary = { candidates: profiles?.length ?? 0, emailed, errors: errors.length };
  console.log(`refund-guarantee-reminder: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`refund-guarantee-reminder errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
