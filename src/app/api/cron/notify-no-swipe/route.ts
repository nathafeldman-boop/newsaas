import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
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

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - REMINDER_DELAY_HOURS * 3600 * 1000);
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("onboarding_completed", true)
    .is("no_swipe_reminder_sent_at", null)
    .lte("created_at", cutoff.toISOString())
    .not("email", "is", null);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let emailed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
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
<p style="font-size:12px;color:#888">Un souci pour accéder à l'app ? Réponds directement à cet email.</p>`,
      });

      emailed++;
    } catch (err) {
      errors.push(`profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ profilesChecked: profiles?.length ?? 0, emailed, skipped, errors });
}
