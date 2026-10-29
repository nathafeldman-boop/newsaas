import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows, fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders, unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";
import { AUTO_DAILY_LIMIT, FLASH_OFFER, isFlashCampaignOpen, isLegacyOffer, LIFETIME_PROMO, PLAN_PRICES, priceSheet } from "@/lib/pricing/plans";
import { SITE_URL } from "@/lib/site";
import { getTrustCount } from "@/lib/premium/trustCount";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { CHECKOUT_RELANCE_EVENT } from "@/lib/campaigns/relanceCheckout";
import {
  CAMPAIGN_EVENT,
  MIN_COUNT_TO_SHOW,
  catalogSize,
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
// - Volume : 500 emails par passage horaire de 7 h 30 à 20 h 30 (heure de
//   Paris) depuis le 28/10 (avant : 1 000 par jour, Nathan, 24/10, pour
//   laisser au quota Resend la place des candidatures de l'offre Auto) ;
//   moins s'il y a moins de comptes à relancer ce jour-là.
// Pas de fausse urgence : le seul compte à rebours est celui de la vraie
// promo (accès à vie à 30 €, fin le 25/10 à 0 h 30) et des 10 minutes du
// prix de bienvenue.
//
// Depuis le 26/10 (Nathan, 25/10 : « l'email d'hier a ramené plusieurs
// paiements, refais le même email demain, après-demain… toujours le même ») :
// chaque envoi reprend l'email n°1, un par jour au plus, et les comptes
// jamais relancés passent avant les rappels. Toujours 5 au plus par compte,
// et jamais deux emails de relance le même jour (série, paiement non
// finalisé, campagnes).
//
// Offre 48 h (Nathan, 28/10, voir FLASH_OFFER) : pendant la campagne, le
// premier email de la série reçu ouvre 48 h d'offre pour ce compte (noté
// metadata.flash sur l'envoi) ; l'email suivant, s'il tombe avant la fin, le
// rappelle avec la vraie heure de fin ; après, l'email habituel.

type Db = SupabaseClient<Database>;

const TAG = "serie_premium_2026_10";
export const SERIES_STEPS = 5;
const DAY = 86_400_000;
/** Le même email (le n°1) à chaque envoi de la série. */
const SAME_EMAIL_EVERY_DAY = true;
// Nouveaux inscrits (Nathan, 24/10) : 1er email 1 h après l'inscription,
// le prix de bienvenue de leur 1re visite ayant expiré entre-temps.
const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000;
const FRESH_SIGNUP_MS = 2 * DAY;
export const SERIES_START = Date.parse("2026-10-24T05:30:00Z");

// Campagne « nouveautés » (Nathan, 29/10 : « une campagne d'email [...] tu
// mets toutes les nouvelles features [...] un objectif de vous faire avoir
// votre alternance en 2 mois maximum [...] le but c'est vraiment que vous
// trouviez votre alternance le plus vite possible »). À partir de
// NEWS_LAUNCH, chaque email de la série montre les nouveautés et
// l'objectif ; les comptes qui avaient déjà reçu les 5 emails reçoivent
// celui-ci une fois (n° 6), puis plus rien. L'objectif est écrit comme un
// objectif, jamais comme une promesse ; la seule garantie est celle des CGV
// (aucun entretien en 2 mois de Premium = remboursé).
// Fixé à la mise en ligne (29/10, 16 h 55 heure de Paris) : le passage de
// 16 h 30 est parti avec l'email habituel.
export const NEWS_LAUNCH = Date.parse("2026-10-29T15:55:00Z");
export const NEWS_STEP = 6;
const NEWS_FEATURES: { title: string; text: string }[] = [
  {
    title: "Candidatures spontanées",
    text: "les entreprises qui recrutent dans ton métier près de chez toi, même sans annonce publiée, avec La bonne alternance (le service public de l'alternance). Ta candidature part en un clic.",
  },
  {
    title: "Stageio Auto",
    text: `chaque like envoie ta candidature, lettre et CV, jusqu'à ${AUTO_DAILY_LIMIT} par jour, et les réponses des recruteurs arrivent dans ta boîte Stageio.`,
  },
  { title: "Relances", text: "7 jours sans réponse après une candidature ? On relance pour toi avec Auto, ou on te le rappelle." },
  { title: "Alertes", text: "une nouvelle offre qui te correspond vraiment ? Tu la reçois dans l'heure (en journée), avant les autres." },
  { title: "Entretiens", text: "un recruteur te répond ? Le simulateur d'entretien te prépare aux questions de ton métier." },
];
const FIRST_PARIS_HOUR = 7;
const LAST_PARIS_HOUR = 20;

// 500 emails par passage horaire (Nathan, 28/10 : « j'en veux le maximum
// possible […] 500 par heure, tous les jours »), soit 7 000 par jour au plus
// sur les 14 passages de 7 h 30 à 20 h 30 ; moins quand il reste moins de
// comptes à relancer (un email par jour et 5 au plus par compte).
export const SERIES_PER_RUN = 500;
export const SERIES_DAILY_CAP = SERIES_PER_RUN * (LAST_PARIS_HOUR - FIRST_PARIS_HOUR + 1);

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
export function parisClock(now: number): { hour: number; midnight: number } {
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

// flashEndsAt : fin de l'offre 48 h déjà ouverte pour ce compte (sinon null) ;
// opensFlash : cet envoi ouvre l'offre.
type Due = { profile: SeriesProfile; step: number; flashEndsAt: number | null; opensFlash: boolean };

// Adresses que Resend refuse d'office (point juste avant le @, deux points
// de suite…) : sinon retentées, et refusées, à chaque passage.
const SENDABLE_EMAIL = /^(?!\.)(?!.*\.\.)[^\s@]+(?<!\.)@[^\s@]+\.[^\s@]+$/;

async function loadDue(db: Db, now: number, midnight: number): Promise<{ due: Due[]; sentToday: number }> {
  const [profiles, seriesEvents, otherEvents] = await Promise.all([
    fetchAllRowsByIdCursor<SeriesProfile>((afterId, limit) => {
      // Filtres de base faits par la base (moins de lignes lues à chaque passage) ;
      // les mêmes sont revérifiés plus bas.
      let q = db.from("profiles").select(COLUMNS).not("notify_new_offers", "is", false).is("search_completed_at", null).or("total_paid_cents.is.null,total_paid_cents.eq.0").not("email", "is", null);
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit) as unknown as PromiseLike<{
        data: SeriesProfile[] | null;
        error: { message: string } | null;
      }>;
    }),
    fetchAllRows<{ user_id: string; created_at: string; metadata: Record<string, unknown> | null }>((from, to) =>
      db.from("user_events").select("user_id, created_at, metadata").eq("event_type", SALES_SERIES_EVENT).order("created_at").range(from, to),
    ),
    fetchAllRows<{ user_id: string }>((from, to) =>
      db
        .from("user_events")
        .select("user_id")
        .in("event_type", [NEWS_CAMPAIGN_EVENT, CAMPAIGN_EVENT, CHECKOUT_RELANCE_EVENT, CHECKOUT_DAILY_EVENT])
        .gte("created_at", new Date(midnight).toISOString())
        .order("created_at")
        .range(from, to),
    ),
  ]);

  const history = new Map<string, { count: number; last: number }>();
  // Premier envoi qui a ouvert l'offre 48 h, par compte (événements triés par date).
  const flashOpened = new Map<string, number>();
  // Comptes qui ont déjà reçu un email depuis le lancement des nouveautés.
  const newsSent = new Set<string>();
  let sentToday = 0;
  for (const e of seriesEvents) {
    const at = Date.parse(e.created_at);
    if (at >= midnight) sentToday++;
    if (at >= NEWS_LAUNCH) newsSent.add(e.user_id);
    const h = history.get(e.user_id) ?? { count: 0, last: 0 };
    history.set(e.user_id, { count: h.count + 1, last: Math.max(h.last, at) });
    if (e.metadata?.flash === true && !flashOpened.has(e.user_id)) flashOpened.set(e.user_id, at);
  }
  const campaignOpen = isFlashCampaignOpen(now);
  const flashFor = (userId: string): Pick<Due, "flashEndsAt" | "opensFlash"> => {
    const opened = flashOpened.get(userId);
    if (opened !== undefined) return { flashEndsAt: opened + FLASH_OFFER.windowMs, opensFlash: false };
    return { flashEndsAt: null, opensFlash: campaignOpen };
  };
  const recentOther = new Set(otherEvents.map((e) => e.user_id));

  const continuing: (Due & { last: number })[] = [];
  const starting: Due[] = [];
  const relaunch: Due[] = [];
  const newsOpen = now >= NEWS_LAUNCH;
  for (const p of profiles) {
    if (!p.email || isAdminEmail(p.email) || !SENDABLE_EMAIL.test(p.email)) continue;
    if (p.notify_new_offers === false || p.search_completed_at) continue;
    if (isPremium(p) || (p.total_paid_cents ?? 0) > 0) continue;
    if (now - Date.parse(p.created_at) < MIN_ACCOUNT_AGE_MS) continue;
    if (recentOther.has(p.id)) continue;
    const h = history.get(p.id);
    // Un par jour au plus (déjà reçu depuis minuit : demain).
    if (h && h.last >= midnight) continue;
    // Série finie : l'email des nouveautés une fois (n° 6), puis plus rien.
    if (h && h.count >= SERIES_STEPS) {
      if (newsOpen && h.count < NEWS_STEP && !newsSent.has(p.id)) relaunch.push({ profile: p, step: NEWS_STEP, ...flashFor(p.id) });
      continue;
    }
    if (h) continuing.push({ profile: p, step: h.count + 1, last: h.last, ...flashFor(p.id) });
    else starting.push({ profile: p, step: 1, ...flashFor(p.id) });
  }
  // Les inscrits des 2 derniers jours d'abord (les plus chauds, les plus
  // récents en tête), puis les comptes jamais relancés (venus le plus
  // récemment d'abord), puis les rappels (les plus en retard en tête) : le
  // quota du jour sert d'abord à faire découvrir l'email.
  continuing.sort((a, b) => a.last - b.last);
  const recency = (p: SeriesProfile) => Date.parse(p.last_active_at ?? p.created_at);
  starting.sort((a, b) => recency(b.profile) - recency(a.profile));
  const fresh = starting
    .filter((d) => now - Date.parse(d.profile.created_at) < FRESH_SIGNUP_MS)
    .sort((a, b) => Date.parse(b.profile.created_at) - Date.parse(a.profile.created_at));
  const others = starting.filter((d) => now - Date.parse(d.profile.created_at) >= FRESH_SIGNUP_MS);
  // Nouveautés : ceux qui avaient fini la série passent avant les rappels.
  relaunch.sort((a, b) => recency(b.profile) - recency(a.profile));
  return { due: [...fresh, ...others, ...relaunch, ...continuing], sentToday };
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

/**
 * Catalogue des offres actives, regroupé par contrat, secteur et lieu (un
 * nombre par ligne), en cache 6 h (25/10 : chaque passage horaire relisait
 * les 14 000 offres actives, la base saturait). Suffit au nombre d'offres
 * de l'email n°1 ; pas aux listes d'offres (intitulés vides).
 */
export function compactCatalog(catalog: Catalog): Catalog {
  const groups = new Map<string, Catalog["offers"][number]>();
  for (const o of catalog.offers) {
    const key = `${o.contract_type}|${o.sector ?? ""}|${o.location}`;
    const g = groups.get(key);
    if (g) {
      g.n = (g.n ?? 1) + (o.n ?? 1);
      if (o.created_at > g.created_at) g.created_at = o.created_at;
    } else {
      groups.set(key, { id: key, title: "", company: "", contract_type: o.contract_type, sector: o.sector, location: o.location, created_at: o.created_at, n: o.n ?? 1 });
    }
  }
  return { offers: [...groups.values()] };
}

export const loadCompactCatalog = unstable_cache(async (): Promise<Catalog> => compactCatalog(await loadCatalog(createAdminClient())), ["serie-compact-catalog-v1"], {
  revalidate: 6 * 3600,
});

export type RenderedSeriesEmail = { subject: string; html: string; text: string };

const PARIS_DATE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Fin de l'offre 48 h à l'heure de Paris, arrondie à la minute inférieure
// (jamais plus tard que la vraie fin) : « jeudi 30 octobre à 18 h 30 », et
// en court par rapport à maintenant : « ce soir à 18 h 30 », « demain à 9 h ».
// « Moins de N centimes par jour » (30 jours par mois), N arrondi aux 5
// centimes au-dessus : 7,99 € → 30, 9,99 € → 35.
export function centsPerDayCeiling(monthlyPrice: string): number {
  const cents = Math.round(Number(monthlyPrice.replace(/[^\d,]/g, "").replace(",", ".")) * 100);
  return Math.ceil(cents / 30 / 5) * 5;
}

export function parisDeadline(endsAt: number, now: number): { long: string; short: string } {
  const at = Math.floor(endsAt / 60_000) * 60_000;
  const parts = PARIS_DATE.formatToParts(new Date(at));
  const get = (type: string) => parts.find((x) => x.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = get("minute");
  const time = `${hour}\u00a0h${minute === "00" ? "" : `\u00a0${minute}`}`;
  const days = Math.round((parisClock(at).midnight - parisClock(now).midnight) / DAY);
  const short =
    days <= 0 ? `${hour >= 18 ? "ce soir" : "aujourd'hui"} à ${time}` : days === 1 ? `demain à ${time}` : `${get("weekday")} à ${time}`;
  return { long: `${get("weekday")} ${get("day")} ${get("month")} à ${time}`, short };
}

// trustCount : vrai nombre de comptes inscrits (même chiffre que le paywall).
// flashEndsAt : fin de l'offre 48 h du compte (ouverte par cet envoi ou un
// précédent), sinon null.
export function renderSeriesEmail(
  p: CampaignProfile,
  step: number,
  catalog: Catalog,
  now: number = Date.now(),
  trustCount = 0,
  flashEndsAt: number | null = null,
): RenderedSeriesEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `Salut ${name},` : "Salut,";
  // Contenu montré : celui de l'email n°1 à chaque envoi (le numéro reste
  // noté pour les statistiques et le lien suivi).
  const shown = SAME_EMAIL_EVERY_DAY ? 1 : step;
  const kind = typePhrase(p.looking_for);
  const counts = countForProfile(catalog, p);
  const where = zonePhrase(counts.zone);
  const whereHtml = escapeHtml(where);
  const showCounts = counts.hasCriteria && counts.matching >= MIN_COUNT_TO_SHOW;
  const wantsAlternance = p.looking_for.length === 0 || p.looking_for.includes("alternance");
  // Campagne nouveautés (voir NEWS_LAUNCH).
  const news = now >= NEWS_LAUNCH;
  const goal = wantsAlternance ? "ton alternance" : "ton stage";
  // Offre 48 h : au moins 1 h pour en profiter, sinon l'email habituel.
  const flash = flashEndsAt !== null && now < flashEndsAt - 60 * 60_000 ? parisDeadline(flashEndsAt, now) : null;
  // Envoi qui ouvre l'offre (fin dans 48 h) ; les suivants, au plus tôt le lendemain, la rappellent.
  const opening = flash !== null && flashEndsAt! - now > FLASH_OFFER.windowMs - 60 * 60_000;
  // Test de prix du 29/10 : mensuel de bienvenue à 9,99 € ; une offre 48 h
  // ouverte avant garde le prix annoncé dans son premier email (7,99 €).
  const monthlyWelcome = priceSheet(flash !== null && isLegacyOffer(flashEndsAt! - FLASH_OFFER.windowMs)).monthly.welcome;
  const perDay = `Moins de ${centsPerDayCeiling(monthlyWelcome)} centimes par jour`;
  // Au moins 30 min pour en profiter avant la fin de la vraie promo.
  const promo = !flash && shown === 1 && now < LIFETIME_PROMO.endsAt - 30 * 60_000;
  const utm = `utm_source=email&utm_medium=serie&utm_campaign=${seriesUtmCampaign(step)}`;
  const go = (plan: "monthly" | "lifetime") => `${SITE_URL}/premium/go?plan=${plan}&${utm}`;
  const termsUrl = `${SITE_URL}/legal/cgv`;
  const offersLineHtml = showCounts
    ? `<strong>${fmt(counts.matching)} offres ${kind}</strong>${whereHtml}`
    : `<strong>${fmt(catalogSize(catalog))} offres</strong> d'alternance et de stage`;
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
  if (flash && opening) {
    subject = news
      ? `🚀 ${name ? `${name}, l` : "L"}e nouveau Stageio est là, et 48 h rien que pour toi`
      : `🎁 ${name ? `${name}, ` : ""}48 h rien que pour toi : Premium à vie à ${FLASH_OFFER.lifetimePrice}`;
    hook = [
      news
        ? `On a beaucoup changé Stageio ces derniers jours, avec un seul but : que tu trouves ${goal} le plus vite possible. Et pour fêter ça, j'ai une offre rien que pour toi, pendant 48&nbsp;heures.`
        : "J'ai une offre rien que pour toi, et elle ne dure que 48&nbsp;heures.",
      `Jusqu'au <strong>${flash.long}</strong>, l'accès Premium <strong>à vie</strong> est à <strong>${FLASH_OFFER.lifetimePrice.replace(" ", "&nbsp;")}</strong> : tu paies une fois, et c'est Premium pour toujours. Tu préfères au mois ? Le mensuel est à <strong>${monthlyWelcome.replace(" ", "&nbsp;")}/mois</strong>, sans engagement.`,
      `En ce moment, ${offersLineHtml} t'attendent sur Stageio. Sans Premium, tu ne vois ni l'entreprise ni l'analyse de chaque offre ; avec, tu vois tout et tu postules en quelques secondes, lettre de motivation comprise.`,
    ];
  } else if (flash) {
    subject = `⏳ ${name ? `${name}, t` : "T"}on offre à ${FLASH_OFFER.lifetimePrice} se termine ${flash.short}`;
    hook = [
      `Petit rappel : ton offre se termine <strong>${flash.short}</strong>.`,
      `Jusque-là, l'accès Premium <strong>à vie</strong> est à <strong>${FLASH_OFFER.lifetimePrice.replace(" ", "&nbsp;")}</strong> (une fois, et c'est fini), ou le mensuel à <strong>${monthlyWelcome.replace(" ", "&nbsp;")}/mois</strong>, sans engagement. Après, ce sera ${PLAN_PRICES.monthly.regular.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.regular.replace(" ", "&nbsp;")} à vie.`,
      `En ce moment, ${offersLineHtml} t'attendent sur Stageio.`,
    ];
  } else if (shown === 1 && promo) {
    subject = `⏳ ${name ? `${name}, l'` : "L'"}accès Premium à vie à ${LIFETIME_PROMO.price}, c'est jusqu'à cette nuit`;
    hook = [
      "Des candidatures envoyées, et pas de réponse ? Des heures sur chaque lettre de motivation ? C'est exactement ce que Premium règle.",
      `Et c'est le dernier jour de la promo : l'accès Premium <strong>à vie</strong> est à <strong>${LIFETIME_PROMO.price}</strong> au lieu de ${LIFETIME_PROMO.referencePrice}, jusqu'à cette nuit 0&nbsp;h&nbsp;30. Tu paies une fois, et c'est fini : pas d'abonnement, Premium pour toujours.`,
      `En ce moment, ${offersLineHtml} t'attendent sur Stageio.`,
    ];
  } else if (shown === 1 && now - Date.parse(p.created_at) < FRESH_SIGNUP_MS) {
    subject = `${name ? `${name}, t` : "T"}on prix de bienvenue t'attend encore (10 min)`;
    hook = [
      "Tu viens de t'inscrire sur Stageio, mais tu n'as pas encore débloqué tes offres.",
      `Bonne nouvelle : ton prix de bienvenue est de nouveau disponible, pendant 10 minutes à partir de ton clic. Et en ce moment, ${offersLineHtml} t'attendent.`,
      "Sans Premium, tu ne vois ni l'entreprise ni l'analyse de chaque offre. Avec Premium, tu vois tout, et tu postules en quelques secondes, lettre de motivation comprise.",
    ];
  } else if (shown === 1 && news) {
    subject = `${name ? `${name}, n` : "N"}otre objectif : ${goal} en 2 mois maximum`;
    hook = [
      `On a beaucoup changé Stageio ces derniers jours, avec un seul but : que tu trouves ${goal} le plus vite possible.`,
      `En ce moment, ${offersLineHtml} t'attendent sur Stageio. Et ton prix de bienvenue est de nouveau disponible, pendant 10 minutes à partir de ton clic.`,
    ];
  } else if (shown === 1) {
    subject = showCounts
      ? `${name ? `${name}, ` : ""}${fmt(counts.matching)} offres ${kind} t'attendent… mais tu ne les vois pas en entier`
      : "Tes offres t'attendent… mais tu ne les vois pas en entier";
    hook = [
      `En ce moment, il y a ${offersLineHtml} sur Stageio.`,
      "Sans Premium, tu ne vois ni l'entreprise ni l'analyse de chaque offre. Avec Premium, tu vois tout, et tu postules en quelques secondes, lettre de motivation comprise.",
    ];
  } else if (shown === 2) {
    subject = `${name ? `${name}, e` : "E"}ncore une candidature sans réponse ?`;
    hook = [
      "Envoyer des candidatures, attendre, et ne rien recevoir : c'est le plus frustrant dans la recherche. Et une lettre de motivation générique, un recruteur la repère tout de suite.",
      "En Premium, ta lettre s'écrit en direct pour l'offre que tu choisis, à partir de ton profil : tu relis, tu ajustes, tu envoies. Une offre, une lettre, quelques secondes.",
    ];
  } else if (shown === 3) {
    subject = `Pas d'entretien en ${GUARANTEE_MONTHS} mois ? On te rembourse. Point.`;
    hook = [
      "Tu hésites encore ? Alors prends Premium sans aucun risque.",
      `Si tu n'as décroché aucun entretien au bout de ${GUARANTEE_MONTHS} mois de Premium, on te rembourse (<a href="${termsUrl}" style="color:#0c7a44">conditions</a>). Soit tu décroches des entretiens, soit tu récupères ton argent.`,
    ];
  } else if (shown === 4) {
    const weekAgo = new Date(now - 7 * DAY).toISOString();
    const week = countForProfile(catalog, p, weekAgo);
    const fresh = counts.hasCriteria && week.newSinceSignup >= MIN_COUNT_TO_SHOW;
    subject = fresh
      ? `${fmt(week.newSinceSignup)} nouvelles offres ${kind} cette semaine : les autres postulent déjà`
      : "Les nouvelles offres de la semaine : les autres postulent déjà";
    const { offers } = pickOffers(catalog, p, weekAgo, 3);
    picks = offers.filter((o) => o.title).map((o) => ({ title: o.title, company: o.company }));
    hook = [
      fresh
        ? `Cette semaine, <strong>${fmt(week.newSinceSignup)} nouvelles offres ${kind}</strong>${whereHtml} sont arrivées sur Stageio. Pendant que tu hésites, d'autres candidats postulent, et une offre ne reste pas en ligne éternellement :`
        : "Voilà des offres arrivées récemment sur Stageio. Pendant que tu hésites, d'autres candidats postulent, et une offre ne reste pas en ligne éternellement :",
    ];
  } else {
    subject = `${name ? `${name}, d` : "D"}ernier email (et dernière fois pour ton prix de bienvenue)`;
    hook = [
      "C'est mon dernier email de cette série, je ne vais pas te relancer encore et encore.",
      `Ton prix de bienvenue (${monthlyWelcome.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.welcome.replace(" ", "&nbsp;")} à vie) t'attend une dernière fois, 10 minutes à partir de ton clic. Après, ce sera ${PLAN_PRICES.monthly.regular.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.regular.replace(" ", "&nbsp;")}. Si tu cherches encore, c'est maintenant.`,
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
  const lifetimePrice = flash
    ? FLASH_OFFER.lifetimePrice.replace(" ", "&nbsp;")
    : promo
      ? `${LIFETIME_PROMO.price.replace(" ", "&nbsp;")} <span style="font-size:16px;color:#888;text-decoration:line-through;font-weight:normal">${LIFETIME_PROMO.referencePrice.replace(" ", "&nbsp;")}</span>`
      : PLAN_PRICES.lifetime.welcome.replace(" ", "&nbsp;");
  const cards = `<div style="border:2px solid #0c7a44;border-radius:16px;padding:16px 18px;margin:16px 0 12px;background:#f2fbf6">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:.04em;color:#0c7a44;text-transform:uppercase">${flash ? "Offre 48 h · " : promo ? "Promo · " : ""}Accès à vie · paiement unique</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:bold;color:#132b33">${lifetimePrice}</p>
<p style="margin:4px 0 14px;font-size:14px;color:#444">Une fois, et Premium pour toujours. Pas d'abonnement, rien d'autre à payer.${
    wantsAlternance ? " Ton premier salaire d'alternant le rembourse plusieurs fois." : ""
  }</p>
${button(go("lifetime"), `Je prends l'accès à vie →`, true)}
</div>
<div style="border:1px solid #d6e4dc;border-radius:16px;padding:16px 18px;margin:0 0 12px">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:.04em;color:#4a5f66;text-transform:uppercase">Mensuel · sans engagement</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:bold;color:#132b33">${monthlyWelcome.replace(" ", "&nbsp;")} <span style="font-size:15px;font-weight:normal;color:#444">/ mois</span></p>
<p style="margin:4px 0 14px;font-size:14px;color:#444">${perDay}. Ce prix reste le tien tant que tu restes abonné.</p>
${button(go("monthly"), "Je prends le mensuel →", false)}
</div>
<p style="margin:0 0 4px;font-size:13px;color:#555">⏱ ${
    flash
      ? `Ton offre, rien que pour toi, jusqu'au ${flash.long}`
      : `Prix de bienvenue valables 10 minutes à partir de ton clic${promo ? " (promo à 30&nbsp;€ jusqu'à cette nuit 0&nbsp;h&nbsp;30)" : ""}`
  }. Ensuite : ${PLAN_PRICES.monthly.regular.replace(" ", "&nbsp;")}/mois ou ${PLAN_PRICES.lifetime.regular.replace(" ", "&nbsp;")} à vie. Paiement sécurisé par Stripe.</p>`;

  const goalLine = `🎯 Notre objectif : ${goal} en 2 mois maximum. Dès le premier jour, tes candidatures partent. Et si tu n'as décroché aucun entretien au bout de ${GUARANTEE_MONTHS} mois de Premium, on te rembourse`;
  const newsHtml = news
    ? `<div style="border-radius:16px;background:#f2fbf6;border:1px solid #cfe9da;padding:16px 18px;margin:16px 0">
<p style="margin:0 0 10px;font-size:13px;font-weight:bold;letter-spacing:.04em;color:#0c7a44;text-transform:uppercase">🆕 Nouveau sur Stageio</p>
${NEWS_FEATURES.map((f) => `<p style="margin:0 0 8px;font-size:14.5px"><strong>${f.title}</strong> : ${escapeHtml(f.text)}</p>`).join("\n")}
</div>
<p style="font-weight:bold;margin:14px 0">${goalLine} (<a href="${termsUrl}" style="color:#0c7a44">conditions</a>).</p>`
    : "";
  const newsText = news ? ["", "Nouveau sur Stageio :", ...NEWS_FEATURES.map((f) => `- ${f.title} : ${f.text}`), "", `${goalLine} (conditions : ${termsUrl}).`] : [];
  const unsubscribeUrl = unsubscribeUrlFor(p.id);
  const footer =
    step > SERIES_STEPS
      ? "Tu reçois cet email parce que tu as un compte sur stageio.fr : un seul email pour te présenter les nouveautés, il n'y en aura pas d'autre."
      : `Tu reçois cet email parce que tu as un compte sur stageio.fr. Série de ${SERIES_STEPS} emails au plus, elle s'arrête dès que tu passes Premium.`;
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
${newsHtml}
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
    ...newsText,
    ...(deadline ? ["", deadline] : []),
    "",
    "Avec Premium :",
    ...benefits.map((b) => `- ${b}`),
    "",
    `Accès à vie, paiement unique : ${strip(flash ? FLASH_OFFER.lifetimePrice : promo ? `${LIFETIME_PROMO.price} au lieu de ${LIFETIME_PROMO.referencePrice}` : PLAN_PRICES.lifetime.welcome)} → ${go("lifetime")}`,
    `Mensuel sans engagement : ${monthlyWelcome} / mois, ${perDay.toLowerCase()} → ${go("monthly")}`,
    strip(
      `${
        flash
          ? `Ton offre, rien que pour toi, jusqu'au ${flash.long}`
          : `Prix de bienvenue valables 10 minutes à partir de ton clic${promo ? " (promo à 30 € jusqu'à cette nuit 0 h 30)" : ""}`
      }. Ensuite : ${PLAN_PRICES.monthly.regular}/mois ou ${PLAN_PRICES.lifetime.regular} à vie.`,
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
// 500 emails au plus, dans la limite du quota du jour.
export async function sendSeriesRun(now: number = Date.now()): Promise<SeriesRunResult> {
  const from = campaignSender();
  if (!from) return { kind: "no_sender" };
  if (now < SERIES_START) return { kind: "not_started" };
  const clock = parisClock(now);
  if (clock.hour < FIRST_PARIS_HOUR || clock.hour > LAST_PARIS_HOUR) return { kind: "outside_hours" };

  const db = createAdminClient();
  const { due, sentToday } = await loadDue(db, now, clock.midnight);
  const quota = Math.max(0, Math.min(SERIES_PER_RUN, seriesDailyCap() - sentToday));
  const batch = due.slice(0, quota);
  const byStep: Record<number, number> = {};
  const failures: string[] = [];
  if (batch.length === 0) return { kind: "sent", sent: 0, due: due.length, quota, byStep, failures };

  const [catalog, trustCount] = await Promise.all([loadCompactCatalog(), getTrustCount().catch(() => 0)]);
  const resend = getResendClient();
  const runKey = new Date(now).toISOString().slice(0, 13);
  let sent = 0;
  // Chaque compte noté avant l'envoi (avec le numéro de l'email), dé-noté si
  // Resend refuse : personne ne reçoit deux fois le même email.
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((d) => ({ user_id: d.profile.id, event_type: SALES_SERIES_EVENT, metadata: d.opensFlash ? { step: d.step, flash: true } : { step: d.step } })))
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
        // L'offre ouverte par cet envoi finit 48 h après sa notation (faite juste avant) : au plus tôt now + 48 h.
        ...renderSeriesEmail(d.profile, d.step, catalog, now, trustCount, d.opensFlash ? now + FLASH_OFFER.windowMs : d.flashEndsAt),
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
  const campaigns = Array.from({ length: NEWS_STEP }, (_, i) => seriesUtmCampaign(i + 1));
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
  const steps = Array.from({ length: NEWS_STEP }, (_, i) => {
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
