import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { SITE_URL } from "@/lib/site";

// Cron quotidien (voir vercel.json) : relance "tu n'as pas encore swipé"
// pour les comptes inscrits depuis au moins REMINDER_DELAY_HOURS qui n'ont
// toujours jamais swipé une seule offre -- cas réel repéré en prod (un
// compte devenu payant compris) qui n'avait jamais mis les pieds sur
// /swipe après l'onboarding, sans qu'on ait aucun moyen de savoir si
// c'était un blocage ou juste "pas encore eu le temps".
//
// Chaque profil n'est évalué qu'une seule fois (no_swipe_reminder_sent_at,
// posé qu'il reçoive l'email ou pas) : jamais de rappel récurrent, et un
// compte qui swipe entre deux runs ne repasse pas indéfiniment dans la
// requête du lendemain.

export const maxDuration = 60;

const REMINDER_DELAY_HOURS = 24;

// Arrêt propre avant le maxDuration de 60 s : le 07/10, avec l'afflux
// d'inscriptions, la boucle a été coupée net par Vercel (un profil pouvait
// alors être marqué sans recevoir l'email). Les profils restants passent au
// run suivant, les plus anciens d'abord. Envois toujours un par un (limite
// de débit de Resend).
const TIME_BUDGET_MS = 45_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const cutoff = new Date(startedAt - REMINDER_DELAY_HOURS * 3600 * 1000);
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("onboarding_completed", true)
    .eq("notify_new_offers", true)
    .is("no_swipe_reminder_sent_at", null)
    .is("search_completed_at", null)
    .lte("created_at", cutoff.toISOString())
    .not("email", "is", null)
    .order("created_at", { ascending: true });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let emailed = 0;
  let skipped = 0;
  const errors: string[] = [];

  let processed = 0;
  for (const profile of profiles ?? []) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    processed++;
    try {
      const { count: swipeCount, error: swipeError } = await admin
        .from("swipes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);

      if (swipeError) {
        errors.push(`profile ${profile.id}: swipe count failed: ${swipeError.message}`);
        continue;
      }

      // Marqué "évalué" avant de décider d'envoyer ou non, sinon un email
      // qui échoue (Resend down, adresse invalide...) ferait retenter ce
      // profil indéfiniment à chaque run plutôt qu'une seule fois.
      const { error: updateError } = await admin
        .from("profiles")
        .update({ no_swipe_reminder_sent_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (updateError) {
        errors.push(`profile ${profile.id}: cursor update failed: ${updateError.message}`);
        continue;
      }

      if ((swipeCount ?? 0) > 0) {
        skipped++;
        continue;
      }
      if (!profile.email) continue;

      await resend.emails.send({
        from: `Stageio <${fromEmail}>`,
        to: profile.email,
        subject: "Tes offres t'attendent 👀",
        html: `<p>Salut${profile.full_name ? ` ${profile.full_name}` : ""},</p>
<p>Tu t'es inscrit·e sur Stageio mais tu n'as pas encore swipé une seule offre. Si t'as juste pas eu deux minutes, elles t'attendent toujours -- ça prend 30 secondes pour voir si l'une d'elles te correspond.</p>
<p><a href="${SITE_URL}/swipe">Voir mes offres sur Stageio</a></p>
${unsubscribeFooterHtml(profile.id)}`,
        headers: unsubscribeHeaders(profile.id),
      });

      emailed++;
    } catch (err) {
      errors.push(`profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const summary = { profilesChecked: processed, remaining: (profiles?.length ?? 0) - processed, emailed, skipped, errors: errors.length };
  console.log(`notify-no-swipe: ${JSON.stringify(summary)}`);
  if (errors.length > 0) console.error(`notify-no-swipe errors: ${errors.slice(0, 10).join(" | ")}`);
  return NextResponse.json({ ...summary, errors });
}
