import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { computeMatchScore } from "@/lib/matching/score";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { knownProfileSectors } from "@/lib/offers/sectors";
import { parisMidnightIso } from "@/lib/applications/autoSend";
import { SPONTANEOUS_EVENT } from "@/lib/spontaneous/targets";
import { computeResults, type Results } from "@/lib/subscribers/results";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import type { Offer, Profile } from "@/types/database";

// « Ta semaine » (29/10, Nathan : « faut vraiment qu'on booste le fait de
// trouver leur alternance […] que les premiums trouvent réellement leur
// truc »). Une alternance se décroche au volume et à la régularité : un
// objectif de 10 candidatures par semaine, et un seul conseil, choisi
// d'après les vrais chiffres de l'abonné (ce qui bloque, dans l'ordre :
// entretien à préparer, CV absent, envois sans réponse, volume, réponses à
// traiter). Affiché dans le tableau de bord, et envoyé chaque lundi matin
// avec 5 offres prêtes à postuler. Les fonctions de rendu sont pures.

type Admin = ReturnType<typeof createAdminClient>;

export const WEEKLY_TARGET = 10;
export const WEEKLY_PLAN_EVENT = "weekly_plan_sent";
/** Lundi, passages de 8 h 15 à 11 h 15 (heure de Paris) : ce qui n'a pas pu partir à 8 h part à l'heure suivante. */
export const WEEKLY_PLAN_HOURS = [8, 9, 10, 11];
const MIN_SCORE = 58;
const MAX_OFFERS = 5;
const DAY = 86_400_000;

export type WeeklyFocus = { key: "entretien" | "cv" | "ciblage" | "volume" | "reponses" | "rythme"; title: string; text: string; cta: string; path: string };

export function weeklyFocus(p: { results: Pick<Results, "sentWeek" | "sentTotal" | "replies" | "interviews">; hasCv: boolean; daysSincePaid: number; auto: boolean }): WeeklyFocus {
  const { results: r, hasCv, daysSincePaid, auto } = p;
  if (r.interviews > 0)
    return {
      key: "entretien",
      title: `Prépare ${r.interviews > 1 ? `tes ${r.interviews} entretiens` : "ton entretien"}`,
      text: "C'est là que tout se joue : entraîne-toi sur les questions de ton métier avec le simulateur, et prépare 2 questions à poser (missions, rythme école-entreprise, tuteur).",
      cta: "Me préparer",
      path: "/dashboard#simulateur",
    };
  if (!hasCv)
    return { key: "cv", title: "Ajoute ton CV", text: "Il part avec chaque candidature : sans lui, les recruteurs ne peuvent pas te répondre.", cta: "Ajouter mon CV", path: "/cv" };
  if (r.sentTotal >= 15 && r.replies === 0 && daysSincePaid >= 10)
    return {
      key: "ciblage",
      title: "Change d'angle",
      text: "Tu postules beaucoup sans réponse pour l'instant. Lance l'audit de ton CV (il dit quoi corriger), et contacte des entreprises en spontané : beaucoup recrutent sans annonce.",
      cta: "Auditer mon CV",
      path: "/cv",
    };
  if (r.sentWeek < WEEKLY_TARGET)
    return {
      key: "volume",
      title: `${WEEKLY_TARGET} candidatures cette semaine`,
      text: auto
        ? `Avec Stageio Auto, chaque like envoie ta candidature : ${WEEKLY_TARGET} likes cette semaine suffisent.`
        : `2 par jour suffisent : la lettre est déjà écrite pour chaque offre. Plus tu postules, plus tu décroches d'entretiens.`,
      cta: "Postuler",
      path: "/swipe",
    };
  if (r.replies > 0)
    return {
      key: "reponses",
      title: "Réponds vite aux recruteurs",
      text: "Des recruteurs t'ont répondu : réponds-leur dans la journée, et relance ceux qui n'ont rien dit après 7 jours.",
      cta: "Mes candidatures",
      path: "/mes-candidatures",
    };
  return { key: "rythme", title: "Garde ce rythme", text: `Encore ${WEEKLY_TARGET} candidatures cette semaine : les premières réponses arrivent souvent dans les jours qui suivent.`, cta: "Postuler", path: "/swipe" };
}

/** Clé de la semaine (lundi, heure de Paris) : un seul point par semaine. */
export function weekKey(now: number): string {
  const midnight = Date.parse(parisMidnightIso(now));
  const weekday = (new Date(midnight + 12 * 3_600_000).getUTCDay() + 6) % 7; // lundi = 0
  return new Date(midnight - weekday * DAY + 12 * 3_600_000).toISOString().slice(0, 10);
}

export function isMondayInParis(now: number): boolean {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short" }).format(new Date(now));
  return day === "Mon";
}

export function renderWeeklyPlan(
  profile: Pick<Profile, "id" | "full_name">,
  results: Pick<Results, "sentWeek" | "replies" | "interviews">,
  focus: WeeklyFocus,
  offers: Pick<Offer, "id" | "title" | "company" | "location">[],
) {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const utm = "utm_source=email&utm_medium=abonnes&utm_campaign=point-du-lundi";
  const link = (path: string) => `${SITE_URL}${path.replace(/#.*$/, "")}${path.includes("?") ? "&" : "?"}${utm}${path.includes("#") ? path.slice(path.indexOf("#")) : ""}`;
  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
  const subject = `${first ? `${first}, t` : "T"}on point du lundi : ${plural(results.sentWeek, "candidature")} la semaine dernière`;
  const stats: [string, number][] = [
    ["Candidatures (7 j)", results.sentWeek],
    ["Réponses", results.replies],
    ["Entretiens", results.interviews],
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${first ? `Salut ${escapeHtml(first)},` : "Salut,"}</p>
<p>Ton point de la semaine, pour décrocher ton alternance au plus vite.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:6px 0 4px"><tr>${stats
    .map(([label, n]) => `<td style="text-align:center;padding:10px 4px;background:#f2faf5;border-radius:10px"><div style="font-size:24px;font-weight:bold;color:#0c7a44">${n}</div><div style="font-size:12px;color:#555">${label}</div></td>`)
    .join('<td style="width:8px"></td>')}</tr></table>
<p style="margin:18px 0 4px;font-size:13px;font-weight:bold;letter-spacing:.04em;color:#0c7a44;text-transform:uppercase">Ta priorité cette semaine</p>
<p style="margin:0;font-size:17px;font-weight:bold">${escapeHtml(focus.title)}</p>
<p style="margin:4px 0 12px">${escapeHtml(focus.text)}</p>
<p style="margin:0 0 18px"><a href="${link(focus.path)}" style="display:inline-block;background:#0c7a44;color:#fff;padding:11px 18px;border-radius:12px;text-decoration:none;font-weight:bold">${escapeHtml(focus.cta)} →</a></p>
${
  offers.length > 0
    ? `<p style="margin:0 0 4px;font-weight:bold">${offers.length > 1 ? `${offers.length} offres pour commencer` : "Une offre pour commencer"} (lettre déjà écrite)&nbsp;:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${offers
        .map(
          (o) =>
            `<tr><td style="padding:9px 0;border-bottom:1px solid #eee"><a href="${link(`/candidature/${o.id}`)}" style="font-weight:700;color:#0c7a44;text-decoration:none">${escapeHtml(o.title)}</a><br><span style="font-size:13px;color:#555">${escapeHtml(o.company)} · ${escapeHtml(o.location)}</span></td></tr>`,
        )
        .join("")}</table>`
    : ""
}
<p style="margin-top:16px">Objectif : <strong>${WEEKLY_TARGET} candidatures</strong> d'ici dimanche. Ton tableau de bord suit ta progression.</p>
<p>Quelque chose te bloque ? Réponds à cet email, je te réponds moi-même.<br>Nathan, fondateur de Stageio</p>
${unsubscribeFooterHtml(profile.id)}
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    `La semaine dernière : ${plural(results.sentWeek, "candidature")}, ${plural(results.replies, "réponse")}, ${plural(results.interviews, "entretien")}.`,
    "",
    `Ta priorité cette semaine : ${focus.title}. ${focus.text} ${link(focus.path)}`,
    "",
    ...offers.map((o) => `- ${o.title} — ${o.company} (${o.location}) : ${link(`/candidature/${o.id}`)}`),
    "",
    `Objectif : ${WEEKLY_TARGET} candidatures d'ici dimanche.`,
    "Quelque chose te bloque ? Réponds à cet email. Nathan",
  ].join("\n");
  return { subject, html, text };
}

export async function runWeeklyPlans(admin: Admin, subscribers: Profile[], isAuto: (p: Profile) => boolean, deadline: number, now: number) {
  const summary = { due: 0, sent: 0, failures: [] as string[] };
  const from = campaignSender();
  if (!from) return summary;
  const week = weekKey(now);
  // Payé depuis au moins 3 jours : avant, l'accueil et « ta 1re candidature » suffisent.
  const candidates = subscribers.filter(
    (p) => p.email && p.notify_new_offers !== false && p.premium_activated_at && now - Date.parse(p.premium_activated_at) >= 3 * DAY,
  );
  if (candidates.length === 0) return summary;
  const { data: sent } = await admin
    .from("user_events")
    .select("user_id")
    .eq("event_type", WEEKLY_PLAN_EVENT)
    .gte("created_at", new Date(now - 6 * DAY).toISOString())
    .in("user_id", candidates.map((p) => p.id));
  const done = new Set((sent ?? []).map((e) => e.user_id));
  const offersBySectors = new Map<string, Offer[]>();
  const resend = getResendClient();

  for (const profile of candidates) {
    if (Date.now() > deadline) break;
    if (done.has(profile.id)) continue;
    summary.due++;
    try {
      const [{ data: apps }, { data: spontaneous }, { data: inbound }, { data: swiped }] = await Promise.all([
        admin.from("applications").select("offer_id, status, applied_at, sent_at").eq("user_id", profile.id),
        admin.from("user_events").select("created_at").eq("user_id", profile.id).eq("event_type", SPONTANEOUS_EVENT).limit(2000),
        admin.from("inbox_messages").select("created_at").eq("user_id", profile.id).eq("direction", "in").limit(2000),
        admin.from("swipes").select("offer_id").eq("user_id", profile.id).gte("created_at", new Date(now - 30 * DAY).toISOString()).limit(2000),
      ]);
      const results = computeResults({
        applications: apps ?? [],
        spontaneousAt: (spontaneous ?? []).map((e) => e.created_at),
        inboundAt: (inbound ?? []).map((m) => m.created_at),
        now,
      });
      const focus = weeklyFocus({ results, hasCv: !!profile.cv_path, daysSincePaid: (now - Date.parse(profile.premium_activated_at!)) / DAY, auto: isAuto(profile) });
      const sectors = knownProfileSectors(profile.sectors);
      const key = sectors.slice().sort().join("|");
      let offers = offersBySectors.get(key);
      if (!offers) {
        offers = await fetchActiveOffers(admin, { sectors, publishedAfter: new Date(now - 10 * DAY).toISOString(), limit: 400 });
        offersBySectors.set(key, offers);
      }
      const seen = new Set([...(apps ?? []).map((a) => a.offer_id), ...(swiped ?? []).map((s) => s.offer_id)]);
      const picks = offers
        .filter((o) => !seen.has(o.id))
        .map((offer) => ({ offer, score: computeMatchScore(profile, offer, now) }))
        .filter((m) => m.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_OFFERS)
        .map((m) => m.offer);
      const { error } = await resend.emails.send(
        {
          from,
          to: profile.email as string,
          replyTo: CONTACT_EMAIL,
          ...renderWeeklyPlan(profile, results, focus, picks),
          headers: unsubscribeHeaders(profile.id),
          tags: [{ name: "campaign", value: "weekly_plan" }],
        },
        { idempotencyKey: `weekly-plan-${profile.id}-${week}` },
      );
      if (error) {
        summary.failures.push(`${profile.id} : ${error.message}`);
        continue;
      }
      summary.sent++;
      await admin.from("user_events").insert({ user_id: profile.id, event_type: WEEKLY_PLAN_EVENT, metadata: { week, focus: focus.key, sentWeek: results.sentWeek } });
    } catch (err) {
      summary.failures.push(`${profile.id} : ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return summary;
}
