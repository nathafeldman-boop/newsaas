import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows, fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders, unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";
import { LIFETIME_PROMO, PLAN_PRICES } from "@/lib/pricing/plans";
import { SITE_URL } from "@/lib/site";
import { getTrustCount } from "@/lib/premium/trustCount";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { CHECKOUT_RELANCE_EVENT } from "@/lib/campaigns/relanceCheckout";
import {
  CAMPAIGN_EVENT,
  MIN_COUNT_TO_SHOW,
  NEWS_CAMPAIGN_EVENT,
  countForProfile,
  escapeHtml,
  firstName,
  loadCatalog,
  pickOffers,
  typePhrase,
  zonePhrase,
  type CampaignProfile,
  type Catalog,
} from "@/lib/campaigns/relanceOffres";
import type { Database } from "@/types/database";

// Série d'emails Premium (Nathan, 24/10 : « des relances qui ont pour but
// de convertir ces personnes en clients payants », « un email tous les 2-3
// jours », « l'email doit être comme un deuxième paywall ultra vendeur »).
// - 5 emails au plus par compte, au moins 2 jours d'écart, jamais le
//   lendemain d'une autre relance ; la série s'arrête dès qu'il paie, se
//   désabonne ou a trouvé.
// - Chaque email reprend le paywall : avantages, prix, garantie, et deux
//   boutons qui mènent droit au paiement Stripe (/premium/go). Le prix de
//   bienvenue repart de zéro après chaque email (voir pricing/welcome.ts).
// - Volume : 1 000 emails par jour au plus (Nathan, 24/10 : « au lieu
//   d'en envoyer 3000, tu en envoies 1000 », pour laisser au quota Resend la
//   place des candidatures envoyées par l'offre Auto ; avant : 1 500, et
//   3 000 prévus à partir du lundi 26/10), répartis sur les passages de
//   7 h 30 à 20 h 30 (heure de Paris) ; moins s'il y a moins de comptes à
//   relancer ce jour-là.
// Pas de fausse urgence : le seul compte à rebours est celui de la vraie
// promo (accès à vie à 30 €, fin le 25/10 à 0 h 30) et des 10 minutes du
// prix de bienvenue.

type Db = SupabaseClient<Database>;

const TAG = "serie_premium_2026_10";
export const SERIES_STEPS = 5;
const DAY = 86_400_000;
const STEP_GAP_MS = 2 * DAY;
const OTHER_GAP_MS = DAY;
// Nouveaux inscrits (Nathan, 24/10) : 1er email 1 h après l'inscription,
// le prix de bienvenue de leur 1re visite ayant expiré entre-temps.
const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000;
const FRESH_SIGNUP_MS = 2 * DAY;
export const SERIES_START = Date.parse("2026-10-24T05:30:00Z");
const FIRST_PARIS_HOUR = 7;
const LAST_PARIS_HOUR = 20;

export const SERIES_DAILY_CAP = 1000;

export function seriesDailyCap(): number {
  return SERIES_DAILY_CAP;
}

export function seriesUtmCampaign(step: number): string {
  return `serie-premium-${step}`;
}

type SeriesProfile = CampaignProfile & { current_period_end: string | null };

const COLUMNS =
  "id, email, full_name, city, sectors, looking_for, subscription_status, current_period_end, total_paid_cents, notify_new_offers, search_completed_at, inactive_campaign_emails_sent, created_at, last_active_at";

// Heure et minuit de Paris (changement d'heure compris).
function parisClock(now: number): { hour: number; midnight: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const sinceMidnight = ((get("hour") * 60 + get("minute")) * 60 + get("second")) * 1000 + (now % 1000);
  return { hour: get("hour"), midnight: now - sinceMidnight };
}

type Due = { profile: SeriesProfile; step: number };

// Adresses que Resend refuse d'office (point juste avant le @, deux points
// de suite…) : sinon retentées, et refusées, à chaque passage.
const SENDABLE_EMAIL = /^(?!\.)(?!.*\.\.)[^\s@]+(?<!\.)@[^\s@]+\.[^\s@]+$/;

async function loadDue(db: Db, now: number, midnight: number): Promise<{ due: Due[]; sentToday: number }> {
  const [profiles, seriesEvents, otherEvents] = await Promise.all([
    fetchAllRowsByIdCursor<SeriesProfile>((afterId, limit) => {
      let q = db.from("profiles").select(COLUMNS);
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit) as unknown as PromiseLike<{
        data: SeriesProfile[] | null;
        error: { message: string } | null;
      }>;
    }),
    fetchAllRows<{ user_id: string; created_at: string }>((from, to) =>
      db.from("user_events").select("user_id, created_at").eq("event_type", SALES_SERIES_EVENT).order("created_at").range(from, to),
    ),
    fetchAllRows<{ user_id: string }>((from, to) =>
      db
        .from("user_events")
        .select("user_id")
        .in("event_type", [NEWS_CAMPAIGN_EVENT, CAMPAIGN_EVENT, CHECKOUT_RELANCE_EVENT])
        .gte("created_at", new Date(now - OTHER_GAP_MS).toISOString())
        .order("created_at")
        .range(from, to),
    ),
  ]);

  const history = new Map<string, { count: number; last: number }>();
  let sentToday = 0;
  for (const e of seriesEvents) {
    const at = Date.parse(e.created_at);
    if (at >= midnight) sentToday++;
    const h = history.get(e.user_id) ?? { count: 0, last: 0 };
    history.set(e.user_id, { count: h.count + 1, last: Math.max(h.last, at) });
  }
  const recentOther = new Set(otherEvents.map((e) => e.user_id));

  const continuing: (Due & { last: number })[] = [];
  const starting: Due[] = [];
  for (const p of profiles) {
    if (!p.email || isAdminEmail(p.email) || !SENDABLE_EMAIL.test(p.email)) continue;
    if (p.notify_new_offers === false || p.search_completed_at) continue;
    if (isPremium(p) || (p.total_paid_cents ?? 0) > 0) continue;
    if (now - Date.parse(p.created_at) < MIN_ACCOUNT_AGE_MS) continue;
    if (recentOther.has(p.id)) continue;
    const h = history.get(p.id);
    if (h && (h.count >= SERIES_STEPS || now - h.last < STEP_GAP_MS)) continue;
    if (h) continuing.push({ profile: p, step: h.count + 1, last: h.last });
    else starting.push({ profile: p, step: 1 });
  }
  // Les inscrits des 2 derniers jours d'abord (les plus chauds, les plus
  // récents en tête), puis la suite de la série (les plus en retard en
  // tête), puis les autres comptes, venus le plus récemment d'abord.
  continuing.sort((a, b) => a.last - b.last);
  const recency = (p: SeriesProfile) => Date.parse(p.last_active_at ?? p.created_at);
  starting.sort((a, b) => recency(b.profile) - recency(a.profile));
  const fresh = starting
    .filter((d) => now - Date.parse(d.profile.created_at) < FRESH_SIGNUP_MS)
    .sort((a, b) => Date.parse(b.profile.created_at) - Date.parse(a.profile.created_at));
  const others = starting.filter((d) => now - Date.parse(d.profile.created_at) >= FRESH_SIGNUP_MS);
  return { due: [...fresh, ...continuing, ...others], sentToday };
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

export type RenderedSeriesEmail = { subject: string; html: string; text: string };

// trustCount : vrai nombre de comptes inscrits (même chiffre que le paywall).
export function renderSeriesEmail(
  p: CampaignProfile,
  step: number,
  catalog: Catalog,
  now: number = Date.now(),
  trustCount = 0,
): RenderedSeriesEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `Salut ${name},` : "Salut,";
  const kind = typePhrase(p.looking_for);
  const counts = countForProfile(catalog, p);
  const where = zonePhrase(counts.zone);
  const whereHtml = escapeHtml(where);
  const showCounts = counts.hasCriteria && counts.matching >= MIN_COUNT_TO_SHOW;
  const wantsAlternance = p.looking_for.length === 0 || p.looking_for.includes("alternance");
  // Au moins 30 min pour en profiter avant la fin de la vraie promo.
  const promo = step === 1 && now < LIFETIME_PROMO.endsAt - 30 * 60_000;
  const utm = `utm_source=email&utm_medium=serie&utm_campaign=${seriesUtmCampaign(step)}`;
  const go = (plan: "monthly" | "lifetime") => `${SITE_URL}/premium/go?plan=${plan}&${utm}`;
  const termsUrl = `${SITE_URL}/legal/cgv`;
  const offersLineHtml = showCounts
    ? `<strong>${fmt(counts.matching)} offres ${kind}</strong>${whereHtml}`
    : `<strong>${fmt(catalog.offers.length)} offres</strong> d'alternance et de stage`;
  const strip = (html: string) =>
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  let subject: string;
  let hook: string[];
  let picks: { title: string; company: string }[] = [];

  // Les leviers sont vrais : délai légal du contrat d'apprentissage (guide
  // « calendrier de l'alternance », article L6222-12), offres réellement
  // masquées sans Premium, garantie, vrais prix et vrai nombre d'inscrits.
  if (step === 1 && promo) {
    subject = `⏳ ${name ? `${name}, l'` : "L'"}accès Premium à vie à ${LIFETIME_PROMO.price}, c'est jusqu'à cette nuit`;
    hook = [
      "Des candidatures envoyées, et pas de réponse ? Des heures sur chaque lettre de motivation ? C'est exactement ce que Premium règle.",
      `Et c'est le dernier jour de la promo : l'accès Premium <strong>à vie</strong> est à <strong>${LIFETIME_PROMO.price}</strong> au lieu de ${LIFETIME_PROMO.referencePrice}, jusqu'à cette nuit 0&nbsp;h&nbsp;30. Tu paies une fois, et c'est fini : pas d'abonnement, Premium pour toujours.`,
      `En ce moment, ${offersLineHtml} t'attendent sur Stageio.`,
    ];
  } else if (step === 1 && now - Date.parse(p.created_at) < FRESH_SIGNUP_MS) {
    subject = `${name ? `${name}, t` : "T"}on prix de bienvenue t'attend encore (10 min)`;
    hook = [
      "Tu viens de t'inscrire sur Stageio, mais tu n'as pas encore débloqué tes offres.",
      `Bonne nouvelle : ton prix de bienvenue est de nouveau disponible, pendant 10 minutes à partir de ton clic. Et en ce moment, ${offersLineHtml} t'attendent.`,
      "Sans Premium, tu ne vois ni l'entreprise ni l'analyse de chaque offre. Avec Premium, tu vois tout, et tu postules en quelques secondes, lettre de motivation comprise.",
    ];
  } else if (step === 1) {
    subject = showCounts
      ? `${name ? `${name}, ` : ""}${fmt(counts.matching)} offres ${kind} t'attendent… mais tu ne les vois pas en entier`
      : "Tes offres t'attendent… mais tu ne les vois pas en entier";
    hook = [
      `En ce moment, il y a ${offersLineHtml} sur Stageio.`,
      "Sans Premium, tu ne vois ni l'entreprise ni l'analyse de chaque offre. Avec Premium, tu vois tout, et tu postules en quelques secondes, lettre de motivation comprise.",
    ];
  } else if (step === 2) {
    subject = `${name ? `${name}, e` : "E"}ncore une candidature sans réponse ?`;
    hook = [
      "Envoyer des candidatures, attendre, et ne rien recevoir : c'est le plus frustrant dans la recherche. Et une lettre de motivation générique, un recruteur la repère tout de suite.",
      "En Premium, ta lettre s'écrit en direct pour l'offre que tu choisis, à partir de ton profil : tu relis, tu ajustes, tu envoies. Une offre, une lettre, quelques secondes.",
    ];
  } else if (step === 3) {
    subject = `Pas d'entretien en ${GUARANTEE_MONTHS} mois ? On te rembourse. Point.`;
    hook = [
      "Tu hésites encore ? Alors prends Premium sans aucun risque.",
      `Si tu n'as décroché aucun entretien au bout de ${GUARANTEE_MONTHS} mois de Premium, on te rembourse (<a href="${termsUrl}" style="color:#0c7a44">conditions</a>). Soit tu décroches des entretiens, soit tu récupères ton argent.`,
    ];
  } else if (step === 4) {
    const weekAgo = new Date(now - 7 * DAY).toISOString();
    const week = countForProfile(catalog, p, weekAgo);
    const fresh = counts.hasCriteria && week.newSinceSignup >= MIN_COUNT_TO_SHOW;
    subject = fresh
      ? `${fmt(week.newSinceSignup)} nouvelles offres ${kind} cette semaine : les autres postulent déjà`
      : "Les nouvelles offres de la semaine : les autres postulent déjà";
    const { offers } = pickOffers(catalog, p, weekAgo, 3);
    picks = offers.map((o) => ({ title: o.title, company: o.company }));
    hook = [
      fresh
        ? `Cette semaine, <strong>${fmt(week.newSinceSignup)} nouvelles offres ${kind}</strong>${whereHtml} sont arrivées sur Stageio. Pendant que tu hésites, d'autres candidats postulent, et une offre ne reste pas en ligne éternellement :`
        : "Voilà des offres arrivées récemment sur Stageio. Pendant que tu hésites, d'autres candidats postulent, et une offre ne reste pas en ligne éternellement :",
    ];
  } else {
    subject = `${name ? `${name}, d` : "D"}ernier email (et dernière fois pour ton prix de bienvenue)`;
    hook = [
      "C'est mon dernier email de cette série, je ne vais pas te relancer encore et encore.",
      `Ton prix de bienvenue (${PLAN_PRICES.monthly.welcome.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.welcome.replace(" ", "&nbsp;")} à vie) t'attend une dernière fois, 10 minutes à partir de ton clic. Après, ce sera ${PLAN_PRICES.monthly.regular.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.regular.replace(" ", "&nbsp;")}. Si tu cherches encore, c'est maintenant.`,
    ];
  }

  // Délai légal (L6222-12) : contrat d'apprentissage au plus tard 3 mois
  // après le début de la formation, d'où « début décembre » pour une
  // rentrée de septembre (même formulation que le guide du site).
  const deadline =
    wantsAlternance && now < Date.parse("2026-12-01T00:00:00Z")
      ? "⏳ Si ta formation a démarré en septembre, la loi te laisse en général jusqu'à début décembre pour démarrer ton contrat d'apprentissage. Chaque semaine compte."
      : null;
  const social = trustCount >= 1000 ? `Déjà plus de ${fmt(Math.floor(trustCount / 100) * 100)} étudiants inscrits sur Stageio.` : null;

  const benefits = [
    "Toutes les offres en clair : entreprise, analyse, description",
    "Ta lettre de motivation sur mesure en quelques secondes, pour chaque offre",
    "Likes, favoris et candidatures illimités",
    "L'audit de ton CV",
    `Remboursé si pas d'entretien au bout de ${GUARANTEE_MONTHS} mois`,
  ];

  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:block;text-align:center;background:${primary ? "#0c7a44" : "#ffffff"};color:${primary ? "#ffffff" : "#0c7a44"};border:2px solid #0c7a44;text-decoration:none;padding:13px 18px;border-radius:12px;font-weight:bold;font-size:16px">${label}</a>`;
  const lifetimePrice = promo
    ? `${LIFETIME_PROMO.price.replace(" ", "&nbsp;")} <span style="font-size:16px;color:#888;text-decoration:line-through;font-weight:normal">${LIFETIME_PROMO.referencePrice.replace(" ", "&nbsp;")}</span>`
    : PLAN_PRICES.lifetime.welcome.replace(" ", "&nbsp;");
  const cards = `<div style="border:2px solid #0c7a44;border-radius:16px;padding:16px 18px;margin:16px 0 12px;background:#f2fbf6">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:.04em;color:#0c7a44;text-transform:uppercase">${promo ? "Promo · " : ""}Accès à vie · paiement unique</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:bold;color:#132b33">${lifetimePrice}</p>
<p style="margin:4px 0 14px;font-size:14px;color:#444">Une fois, et Premium pour toujours. Pas d'abonnement, rien d'autre à payer.${
    wantsAlternance ? " Ton premier salaire d'alternant le rembourse plusieurs fois." : ""
  }</p>
${button(go("lifetime"), `Je prends l'accès à vie →`, true)}
</div>
<div style="border:1px solid #d6e4dc;border-radius:16px;padding:16px 18px;margin:0 0 12px">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:.04em;color:#4a5f66;text-transform:uppercase">Mensuel · sans engagement</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:bold;color:#132b33">${PLAN_PRICES.monthly.welcome.replace(" ", "&nbsp;")} <span style="font-size:15px;font-weight:normal;color:#444">/ mois</span></p>
<p style="margin:4px 0 14px;font-size:14px;color:#444">Moins de 30 centimes par jour. Ce prix reste le tien tant que tu restes abonné.</p>
${button(go("monthly"), "Je prends le mensuel →", false)}
</div>
<p style="margin:0 0 4px;font-size:13px;color:#555">⏱ Prix de bienvenue valables 10 minutes à partir de ton clic${
    promo ? " (promo à 30&nbsp;€ jusqu'à cette nuit 0&nbsp;h&nbsp;30)" : ""
  }. Ensuite : ${PLAN_PRICES.monthly.regular.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.regular.replace(" ", "&nbsp;")} à vie. Paiement sécurisé par Stripe.</p>`;

  const unsubscribeUrl = unsubscribeUrlFor(p.id);
  const footer = `Tu reçois cet email parce que tu as un compte sur stageio.fr. Série de ${SERIES_STEPS} emails au plus, elle s'arrête dès que tu passes Premium.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
${hook.map((h) => `<p>${h}</p>`).join("\n")}
${
  picks.length
    ? `<ul style="margin-top:0;padding-left:20px">\n${picks
        .map((o) => `<li style="margin-bottom:6px"><strong>${escapeHtml(o.title)}</strong>${o.company ? ` · ${escapeHtml(o.company)}` : ""}</li>`)
        .join("\n")}\n</ul>`
    : ""
}
${deadline ? `<p style="background:#fff7e6;border-radius:10px;padding:10px 12px;margin:14px 0">${deadline}</p>` : ""}
<p style="margin:18px 0 6px;font-weight:bold">Avec Premium :</p>
<p style="margin:0">${benefits.map((b) => `✅ ${b}`).join("<br>")}</p>
${cards}
${social ? `<p style="margin:10px 0 0;font-size:14px">👥 ${social}</p>` : ""}
<p style="margin-top:20px">Bonne recherche,<br>Nathan, de Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">${footer} <a href="${unsubscribeUrl}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;

  const text = [
    greeting,
    "",
    ...hook.map(strip),
    ...picks.map((o) => `- ${o.title}${o.company ? ` · ${o.company}` : ""}`),
    ...(deadline ? ["", deadline] : []),
    "",
    "Avec Premium :",
    ...benefits.map((b) => `- ${b}`),
    "",
    `Accès à vie, paiement unique : ${strip(promo ? `${LIFETIME_PROMO.price} au lieu de ${LIFETIME_PROMO.referencePrice}` : PLAN_PRICES.lifetime.welcome)} → ${go("lifetime")}`,
    `Mensuel sans engagement : ${PLAN_PRICES.monthly.welcome} / mois, moins de 30 centimes par jour → ${go("monthly")}`,
    strip(
      `Prix de bienvenue valables 10 minutes à partir de ton clic${promo ? " (promo à 30 € jusqu'à cette nuit 0 h 30)" : ""}. Ensuite : ${PLAN_PRICES.monthly.regular}/mois ou ${PLAN_PRICES.lifetime.regular} à vie.`,
    ),
    ...(social ? ["", social] : []),
    "",
    "Bonne recherche,",
    "Nathan, de Stageio",
    "",
    footer,
    `Ne plus recevoir d'emails de Stageio : ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export type SeriesRunResult =
  | { kind: "no_sender" | "not_started" | "outside_hours" }
  | { kind: "sent"; sent: number; due: number; quota: number; byStep: Record<number, number>; failures: string[] };

// Un passage (cron, toutes les heures de 7 h 30 à 20 h 30, heure de Paris) :
// le quota restant du jour réparti sur les passages restants.
export async function sendSeriesRun(now: number = Date.now()): Promise<SeriesRunResult> {
  const from = campaignSender();
  if (!from) return { kind: "no_sender" };
  if (now < SERIES_START) return { kind: "not_started" };
  const clock = parisClock(now);
  if (clock.hour < FIRST_PARIS_HOUR || clock.hour > LAST_PARIS_HOUR) return { kind: "outside_hours" };

  const db = createAdminClient();
  const { due, sentToday } = await loadDue(db, now, clock.midnight);
  const runsLeft = LAST_PARIS_HOUR - clock.hour + 1;
  const quota = Math.max(0, Math.ceil((seriesDailyCap() - sentToday) / runsLeft));
  const batch = due.slice(0, quota);
  const byStep: Record<number, number> = {};
  const failures: string[] = [];
  if (batch.length === 0) return { kind: "sent", sent: 0, due: due.length, quota, byStep, failures };

  const [catalog, trustCount] = await Promise.all([loadCatalog(db), getTrustCount().catch(() => 0)]);
  const resend = getResendClient();
  const runKey = new Date(now).toISOString().slice(0, 13);
  let sent = 0;
  // Chaque compte noté avant l'envoi (avec le numéro de l'email), dé-noté si
  // Resend refuse : personne ne reçoit deux fois le même email.
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((d) => ({ user_id: d.profile.id, event_type: SALES_SERIES_EVENT, metadata: { step: d.step } })))
      .select("id, user_id");
    if (reserveError || !reserved) {
      failures.push(`Base indisponible, rien envoyé : ${reserveError?.message ?? "réponse vide"}`);
      break;
    }
    const reservedIdByUser = new Map(reserved.map((r) => [r.user_id, r.id]));
    const release = async (userIds: string[]) => {
      const ids = userIds.map((u) => reservedIdByUser.get(u)).filter((id): id is string => Boolean(id));
      if (ids.length === 0) return;
      const { error } = await db.from("user_events").delete().in("id", ids);
      if (error) console.error("serie-premium: dé-notage en échec", error);
    };
    const { data, error } = await resend.batch.send(
      chunk.map((d) => ({
        from,
        to: d.profile.email as string,
        ...renderSeriesEmail(d.profile, d.step, catalog, now, trustCount),
        headers: unsubscribeHeaders(d.profile.id),
        tags: [
          { name: "campaign", value: TAG },
          { name: "step", value: String(d.step) },
        ],
      })),
      { batchValidation: "permissive", idempotencyKey: `${TAG}-${runKey}-${chunk[0].profile.id}-${chunk[chunk.length - 1].profile.id}` },
    );
    if (error || !data) {
      await release(chunk.map((d) => d.profile.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }
    const rejected = new Set((data.errors ?? []).map((e) => chunk[e.index]?.profile.id).filter(Boolean));
    await release([...rejected] as string[]);
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.profile.email}: ${e.message}`);
    for (const d of chunk) {
      if (rejected.has(d.profile.id)) continue;
      sent++;
      byStep[d.step] = (byStep[d.step] ?? 0) + 1;
    }
  }
  return { kind: "sent", sent, due: due.length, quota, byStep, failures };
}

export type SeriesReport = {
  steps: { step: number; sent: number; clickers: number }[];
  sentToday: number;
  clickersToday: number;
  recipients: number;
  payers: number;
  payersCents: number;
};

// Pour /admin/relance : envois et arrivées par email de la série, et les
// destinataires qui ont payé après leur premier email.
export async function loadSeriesReport(db: Db, todayStartIso?: string): Promise<SeriesReport> {
  const campaigns = Array.from({ length: SERIES_STEPS }, (_, i) => seriesUtmCampaign(i + 1));
  const [events, visits] = await Promise.all([
    fetchAllRows<{ user_id: string; metadata: Record<string, unknown> | null; created_at: string }>((from, to) =>
      db
        .from("user_events")
        .select("user_id, metadata, created_at")
        .eq("event_type", SALES_SERIES_EVENT)
        .order("created_at")
        .range(from, to),
    ),
    fetchAllRows<{ visitor_id: string; utm_campaign: string | null; created_at: string }>((from, to) =>
      db
        .from("site_visits")
        .select("visitor_id, utm_campaign, created_at")
        .gte("created_at", new Date(SERIES_START).toISOString())
        .in("utm_campaign", campaigns)
        .order("created_at")
        .range(from, to),
    ),
  ]);
  const firstSent = new Map<string, string>();
  for (const e of events) if (!firstSent.has(e.user_id)) firstSent.set(e.user_id, e.created_at);
  const steps = Array.from({ length: SERIES_STEPS }, (_, i) => {
    const step = i + 1;
    return {
      step,
      sent: events.filter((e) => e.metadata?.step === step).length,
      clickers: new Set(visits.filter((v) => v.utm_campaign === seriesUtmCampaign(step)).map((v) => v.visitor_id)).size,
    };
  });
  let payers = 0;
  let payersCents = 0;
  const ids = [...firstSent.keys()];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db
      .from("profiles")
      .select("id, premium_activated_at, total_paid_cents")
      .in("id", ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) {
      const at = firstSent.get(p.id);
      if (at && p.premium_activated_at && p.premium_activated_at > at && (p.total_paid_cents ?? 0) > 0) {
        payers++;
        payersCents += p.total_paid_cents ?? 0;
      }
    }
  }
  const today = todayStartIso ?? new Date(0).toISOString();
  return {
    steps,
    sentToday: events.filter((e) => e.created_at >= today).length,
    clickersToday: new Set(visits.filter((v) => v.created_at >= today).map((v) => v.visitor_id)).size,
    recipients: firstSent.size,
    payers,
    payersCents,
  };
}
