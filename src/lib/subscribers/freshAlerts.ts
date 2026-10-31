import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { computeMatchScore, profileDepartement } from "@/lib/matching/score";
import { overseasMismatch } from "@/lib/matching/profileLocation";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { offerPath } from "@/lib/offers/publicUrl";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { parisMidnightIso } from "@/lib/applications/autoSend";
import { SITE_URL } from "@/lib/site";
import type { Offer, Profile } from "@/types/database";

// Alerte « offre toute fraîche pour toi » (28/10, Nathan : voir les premiers
// résultats en 2-3 jours) : chaque heure, les offres arrivées sur Stageio
// dans l'heure qui collent vraiment au profil d'un abonné (score de 70 au
// moins), pour qu'il postule parmi les premiers. Deux par jour au plus, et
// pas s'il est sur l'appli à ce moment-là (il les voit déjà dans
// « Nouveautés »). Abonnés seulement, réglage « alertes » respecté.

type Admin = ReturnType<typeof createAdminClient>;

export const FRESH_ALERT_EVENT = "fresh_offer_alert_sent";
const MIN_SCORE = 70;
const MAX_PER_DAY = 2;
const WINDOW_MS = 65 * 60_000;
const ACTIVE_RECENTLY_MS = 30 * 60_000;
const MAX_OFFERS = 3;

export function renderFreshAlert(profile: Pick<Profile, "id" | "full_name">, matches: { offer: Pick<Offer, "id" | "title" | "company" | "location" | "contract_type">; score: number }[]) {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const top = matches[0].offer;
  const utm = "utm_source=email&utm_medium=abonnes&utm_campaign=offre-fraiche";
  const subject = matches.length === 1 ? `🔥 Nouvelle offre il y a moins d'1 h : ${top.title}` : `🔥 ${matches.length} offres pour toi publiées il y a moins d'1 h`;
  const items = matches
    .map(({ offer, score }) => {
      const url = `${SITE_URL}${offerPath(offer)}?${utm}`;
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="${url}" style="font-weight:700;color:#0c7a44;text-decoration:none">${escapeHtml(offer.title)}</a><br><span style="font-size:13px;color:#555">${escapeHtml(offer.company)} · ${escapeHtml(offer.location)} · ${score} % compatible</span></td></tr>`;
    })
    .join("");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${first ? `Salut ${escapeHtml(first)},` : "Salut,"}</p>
<p>${matches.length === 1 ? "Une offre qui te correspond vient d'arriver" : `${matches.length} offres qui te correspondent viennent d'arriver`} sur Stageio. Les premiers candidats sont les plus lus : c'est le moment de postuler.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${items}</table>
<p style="margin-top:18px"><a href="${SITE_URL}/swipe?${utm}" style="display:inline-block;background:#0c7a44;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Postuler maintenant →</a></p>
<p style="font-size:12px;color:#888">Alerte réservée aux abonnés, 2 par jour au plus, seulement pour les offres qui te correspondent vraiment.</p>
${unsubscribeFooterHtml(profile.id)}
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    `${matches.length === 1 ? "Une offre qui te correspond vient d'arriver" : `${matches.length} offres qui te correspondent viennent d'arriver`} sur Stageio :`,
    "",
    ...matches.map(({ offer, score }) => `- ${offer.title} — ${offer.company} (${offer.location}), ${score} % compatible : ${SITE_URL}${offerPath(offer)}?${utm}`),
    "",
    `Postuler maintenant : ${SITE_URL}/swipe?${utm}`,
  ].join("\n");
  return { subject, html, text };
}

export async function runFreshAlerts(admin: Admin, subscribers: Profile[], deadline: number, now: number = Date.now()) {
  const summary = { offers: 0, eligible: 0, sent: 0, failures: [] as string[] };
  const from = campaignSender();
  if (!from) return summary;

  // Sans annonces d'écoles (31/10, voir isSchoolAd).
  const offers = await fetchActiveOffers(admin, { createdAfter: new Date(now - WINDOW_MS).toISOString(), employersOnly: true, limit: 1500 });
  summary.offers = offers.length;
  if (offers.length === 0) return summary;

  const eligible = subscribers.filter(
    (p) => p.notify_new_offers !== false && p.onboarding_completed && !(p.last_active_at && now - Date.parse(p.last_active_at) < ACTIVE_RECENTLY_MS),
  );
  if (eligible.length === 0) return summary;
  const ids = eligible.map((p) => p.id);
  const sentToday = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 200) {
    const rows = await fetchAllRows<{ user_id: string }>((from, to) =>
      admin
        .from("user_events")
        .select("user_id")
        .eq("event_type", FRESH_ALERT_EVENT)
        .in("user_id", ids.slice(i, i + 200))
        .gte("created_at", parisMidnightIso(now))
        .order("created_at")
        .range(from, to),
    );
    for (const r of rows) sentToday.set(r.user_id, (sentToday.get(r.user_id) ?? 0) + 1);
  }

  const resend = getResendClient();
  for (const profile of eligible) {
    if (Date.now() > deadline) break;
    if ((sentToday.get(profile.id) ?? 0) >= MAX_PER_DAY) continue;
    const dep = profileDepartement(profile.city);
    const scored = offers
      .filter((offer) => !overseasMismatch(dep, offer.location))
      .map((offer) => ({ offer, score: computeMatchScore(profile, offer, now) }))
      .filter((m) => m.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_OFFERS * 3);
    if (scored.length === 0) continue;
    const { data: swiped } = await admin.from("swipes").select("offer_id").eq("user_id", profile.id).in("offer_id", scored.map((m) => m.offer.id));
    const seen = new Set((swiped ?? []).map((s) => s.offer_id));
    const matches = scored.filter((m) => !seen.has(m.offer.id)).slice(0, MAX_OFFERS);
    if (matches.length === 0) continue;
    summary.eligible++;
    const { error } = await resend.emails.send(
      { from, to: profile.email as string, ...renderFreshAlert(profile, matches), headers: unsubscribeHeaders(profile.id), tags: [{ name: "campaign", value: "fresh_offer_alert" }] },
      { idempotencyKey: `fresh-alert-${profile.id}-${new Date(now).toISOString().slice(0, 13)}` },
    );
    if (error) {
      summary.failures.push(`${profile.id} : ${error.message}`);
      continue;
    }
    summary.sent++;
    await admin.from("user_events").insert({ user_id: profile.id, event_type: FRESH_ALERT_EVENT, metadata: { offers: matches.map((m) => m.offer.id) } });
  }
  return summary;
}
