import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { computeMatchScore } from "@/lib/matching/score";
import { SITE_URL } from "@/lib/site";
import type { Profile } from "@/types/database";

// Cron quotidien (voir vercel.json) : digest email "nouvelles offres qui te
// correspondent" pour les utilisateurs ayant activé la préférence
// notify_new_offers (réglage "Alertes nouvelles offres" dans /profil).
// Tourne après sync-adzuna (4h) et discover-offers (5h) pour avoir de
// nouvelles offres fraîches à annoncer.

export const maxDuration = 60;

const MIN_SCORE = 55;
const MAX_OFFERS_PER_EMAIL = 5;
// Un premier run n'annonce que les offres publiées récemment plutôt que tout
// l'historique du catalogue -- sinon un compte qui active juste la préférence
// reçoit un email listant des mois d'offres d'un coup.
const FIRST_RUN_WINDOW_HOURS = 24;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const now = new Date();
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("*")
    .eq("notify_new_offers", true)
    .eq("onboarding_completed", true)
    .not("email", "is", null);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let emailed = 0;
  const errors: string[] = [];

  for (const profile of (profiles ?? []) as Profile[]) {
    try {
      const sinceIso = profile.last_offer_alert_sent_at
        ? profile.last_offer_alert_sent_at
        : new Date(now.getTime() - FIRST_RUN_WINDOW_HOURS * 3600 * 1000).toISOString();

      const [{ data: newOffers }, { data: swiped }] = await Promise.all([
        admin
          .from("offers")
          .select("*")
          .eq("is_active", true)
          .gt("published_at", sinceIso)
          .order("published_at", { ascending: false })
          .limit(200),
        admin.from("swipes").select("offer_id").eq("user_id", profile.id),
      ]);

      // Toujours avancer le curseur, même sans offre à annoncer, pour ne
      // jamais re-scanner la même fenêtre à l'infini pour un compte inactif.
      await admin
        .from("profiles")
        .update({ last_offer_alert_sent_at: now.toISOString() })
        .eq("id", profile.id);

      if (!newOffers || newOffers.length === 0) continue;

      const swipedIds = new Set((swiped ?? []).map((s) => s.offer_id));
      const matches = newOffers
        .filter((o) => !swipedIds.has(o.id))
        .map((offer) => ({ offer, score: computeMatchScore(profile, offer) }))
        .filter((m) => m.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_OFFERS_PER_EMAIL);

      if (matches.length === 0) continue;
      if (!profile.email) continue;

      const itemsHtml = matches
        .map(
          ({ offer, score }) =>
            `<li><strong>${offer.title}</strong> — ${offer.company} (${offer.location}) · ${score}% compatible</li>`,
        )
        .join("");

      await resend.emails.send({
        from: `Stageio <${fromEmail}>`,
        to: profile.email,
        subject:
          matches.length === 1
            ? "Une nouvelle offre qui te correspond 👀"
            : `${matches.length} nouvelles offres qui te correspondent 👀`,
        html: `<p>Salut${profile.full_name ? ` ${profile.full_name}` : ""},</p>
<p>De nouvelles offres viennent d'arriver et matchent ton profil :</p>
<ul>${itemsHtml}</ul>
<p><a href="${SITE_URL}/swipe">Voir mes offres sur Stageio</a></p>
<p style="font-size:12px;color:#888">Tu reçois cet email car l'alerte "nouvelles offres" est activée dans ton profil Stageio. Tu peux la désactiver à tout moment depuis la page Profil.</p>`,
      });

      emailed++;
    } catch (err) {
      errors.push(
        `profile ${profile.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return NextResponse.json({ profilesChecked: profiles?.length ?? 0, emailed, errors });
}
