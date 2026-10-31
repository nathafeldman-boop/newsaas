import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { computeMatchScore, profileDepartement } from "@/lib/matching/score";
import { overseasMismatch } from "@/lib/matching/profileLocation";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { knownProfileSectors } from "@/lib/offers/sectors";
import { isSentStatus } from "@/lib/applications/status";
import { SPONTANEOUS_EVENT } from "@/lib/spontaneous/targets";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import type { ApplicationStatus, Offer, Profile } from "@/types/database";

// « Ta 1re candidature » (29/10, satisfaction des abonnés) : un abonné qui
// n'a toujours rien envoyé le lendemain de son paiement reçoit, une seule
// fois, 3 offres qui lui correspondent, avec un lien direct vers la
// candidature (lettre déjà écrite). Le premier envoi est l'étape où l'on
// décroche : « pas assez utilisé » est le premier motif de résiliation donné
// dans Stripe. Passage de 18 h (heure de Paris), entre 20 h et 7 jours après
// le paiement ; réglage « emails » respecté.

type Admin = ReturnType<typeof createAdminClient>;

export const FIRST_APPLICATION_EVENT = "first_application_nudge_sent";
export const FIRST_APPLICATION_HOUR = 18;
const MIN_AFTER_PAYMENT_MS = 20 * 3_600_000;
const MAX_AFTER_PAYMENT_MS = 7 * 86_400_000;
const MIN_SCORE = 58;
const MAX_OFFERS = 3;

export function firstApplicationDue(profile: Pick<Profile, "premium_activated_at" | "notify_new_offers">, now: number): boolean {
  if (profile.notify_new_offers === false) return false;
  const at = profile.premium_activated_at ? Date.parse(profile.premium_activated_at) : NaN;
  return Number.isFinite(at) && now - at >= MIN_AFTER_PAYMENT_MS && now - at <= MAX_AFTER_PAYMENT_MS;
}

/** Aucune candidature partie (« à préparer » et « clôturée » ne comptent pas), aucune spontanée. */
export function hasNotAppliedYet(statuses: ApplicationStatus[], spontaneousSent: number): boolean {
  return spontaneousSent === 0 && !statuses.some(isSentStatus);
}

export function renderFirstApplicationEmail(
  profile: Pick<Profile, "id" | "full_name">,
  offers: Pick<Offer, "id" | "title" | "company" | "location">[],
  auto: boolean,
) {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const utm = "utm_source=email&utm_medium=abonnes&utm_campaign=premiere-candidature";
  const applyUrl = (o: Pick<Offer, "id">) => `${SITE_URL}/candidature/${o.id}?${utm}`;
  const subject = `${first ? `${first}, t` : "T"}a 1re candidature en 2 minutes`;
  const intro = auto
    ? "Ton accès Stageio Auto est actif, mais aucune candidature n'est encore partie. Le plus dur, c'est la première : un like suffit, elle part toute seule avec ta lettre et ton CV."
    : "Ton accès Premium est actif, mais aucune candidature n'est encore partie. Le plus dur, c'est la première : la lettre est déjà écrite, tu relis et tu envoies.";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${first ? `Salut ${escapeHtml(first)},` : "Salut,"}</p>
<p>${intro}</p>
<p>J'ai choisi pour toi ${offers.length === 1 ? "une offre qui te correspond" : `${offers.length} offres qui te correspondent`}&nbsp;:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${offers
    .map(
      (o) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="${applyUrl(o)}" style="font-weight:700;color:#0c7a44;text-decoration:none">${escapeHtml(o.title)}</a><br><span style="font-size:13px;color:#555">${escapeHtml(o.company)} · ${escapeHtml(o.location)}</span></td></tr>`,
    )
    .join("")}</table>
<p style="margin-top:18px"><a href="${applyUrl(offers[0])}" style="display:inline-block;background:#0c7a44;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Postuler à la 1re offre →</a></p>
<p>Quelque chose te bloque (CV, offres, envoi) ? Réponds à cet email, je regarde ton compte et je te réponds moi-même.</p>
<p>Nathan, fondateur de Stageio</p>
${unsubscribeFooterHtml(profile.id)}
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    intro,
    "",
    ...offers.map((o) => `- ${o.title} — ${o.company} (${o.location}) : ${applyUrl(o)}`),
    "",
    "Quelque chose te bloque (CV, offres, envoi) ? Réponds à cet email, je regarde ton compte et je te réponds moi-même.",
    "Nathan, fondateur de Stageio",
  ].join("\n");
  return { subject, html, text };
}

export async function runFirstApplicationNudges(admin: Admin, subscribers: Profile[], isAuto: (p: Profile) => boolean, deadline: number, now: number) {
  const summary = { due: 0, sent: 0, failures: [] as string[] };
  const from = campaignSender();
  if (!from) return summary;
  const candidates = subscribers.filter((p) => p.email && firstApplicationDue(p, now));
  if (candidates.length === 0) return summary;
  const ids = candidates.map((p) => p.id);
  const { data: nudged } = await admin.from("user_events").select("user_id").eq("event_type", FIRST_APPLICATION_EVENT).in("user_id", ids);
  const done = new Set((nudged ?? []).map((e) => e.user_id));

  const resend = getResendClient();
  for (const profile of candidates) {
    if (Date.now() > deadline) break;
    if (done.has(profile.id)) continue;
    const [{ data: apps, error: appsError }, { count: spontaneousSent }] = await Promise.all([
      admin.from("applications").select("offer_id, status").eq("user_id", profile.id),
      admin.from("user_events").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("event_type", SPONTANEOUS_EVENT),
    ]);
    if (appsError) {
      summary.failures.push(`${profile.id} : ${appsError.message}`);
      continue;
    }
    if (!hasNotAppliedYet((apps ?? []).map((a) => a.status), spontaneousSent ?? 0)) continue;
    const already = new Set((apps ?? []).map((a) => a.offer_id));
    const offers = await fetchActiveOffers(admin, { sectors: knownProfileSectors(profile.sectors), employersOnly: true, limit: 300 });
    const picks = offers
      .filter((o) => !already.has(o.id) && !overseasMismatch(profileDepartement(profile.city), o.location))
      .map((offer) => ({ offer, score: computeMatchScore(profile, offer, now) }))
      .filter((m) => m.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_OFFERS)
      .map((m) => m.offer);
    if (picks.length === 0) continue;
    summary.due++;
    const { error } = await resend.emails.send(
      {
        from,
        to: profile.email as string,
        replyTo: CONTACT_EMAIL,
        ...renderFirstApplicationEmail(profile, picks, isAuto(profile)),
        headers: unsubscribeHeaders(profile.id),
        tags: [{ name: "campaign", value: "first_application" }],
      },
      { idempotencyKey: `first-application-${profile.id}` },
    );
    if (error) {
      summary.failures.push(`${profile.id} : ${error.message}`);
      continue;
    }
    summary.sent++;
    await admin.from("user_events").insert({ user_id: profile.id, event_type: FIRST_APPLICATION_EVENT, metadata: { offers: picks.map((o) => o.id) } });
  }
  return summary;
}
