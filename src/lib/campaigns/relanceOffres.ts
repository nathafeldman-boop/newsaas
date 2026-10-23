import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { isDepartmentLocation } from "@/lib/onboarding/options";
import { localCitiesFor } from "@/lib/matching/score";
import { SITE_URL } from "@/lib/site";
import { unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import { GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";
import type { ContractType, Database } from "@/types/database";

// Relances ponctuelles des inscrits qui n'ont jamais payé : UN email par
// campagne, envoyé par lots depuis /admin/relance, jamais automatiquement.
// - « offres » (10/10) : les offres qui les attendent ;
// - « nouveautes » (23/10) : ceux qui ne sont pas venus depuis 7 jours, les
//   nouvelles offres depuis leur dernière visite et ce qui a changé.
// Chaque envoi est noté dans user_events (événement de la campagne) : un
// compte ne reçoit jamais le même email deux fois, et la série « inactifs »
// (cron inactive-winback) saute les comptes relancés dans les 7 jours.
//
// Les chiffres de l'email sont calculés pour chaque profil avec les mêmes
// critères que le deck (type de contrat, secteurs, ville et agglomération) :
// jamais un nombre générique présenté comme « pour toi ».

export const CAMPAIGN_EVENT = "email_relance_offres_2026_10";
export const CAMPAIGN_TAG = "relance_offres_2026_10";
export const NEWS_CAMPAIGN_EVENT = "email_relance_nouveautes_2026_10";
export const NEWS_CAMPAIGN_TAG = "relance_nouveautes_2026_10";
const NEWS_INACTIVE_DAYS = 7;
// Au-delà, l'envoi du jour est refusé. 1 000 jusqu'au 22/10 ; 3 000 depuis
// le 23/10 (Nathan, forfait Resend payant : « 200-300 emails par heure à
// partir de 8 h »). Risque connu : un domaine qui passe d'un coup de
// quelques centaines à 3 000 emails par jour peut finir en spam.
export const MAX_SENT_PER_24H = 3000;
export const BATCH_SIZE = 200;
const MIN_ACCOUNT_AGE_DAYS = 3;

type Db = SupabaseClient<Database>;

export type CampaignProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  sectors: string[];
  looking_for: ContractType[];
  subscription_status: string | null;
  total_paid_cents: number;
  notify_new_offers: boolean;
  search_completed_at: string | null;
  inactive_campaign_emails_sent: number;
  created_at: string;
  last_active_at: string | null;
};

const PROFILE_COLUMNS =
  "id, email, full_name, city, sectors, looking_for, subscription_status, total_paid_cents, notify_new_offers, search_completed_at, inactive_campaign_emails_sent, created_at, last_active_at";

export type ExclusionReason =
  | "sans_email"
  | "desabonne"
  | "premium_ou_deja_paye"
  | "recherche_terminee"
  | "inscrit_recemment"
  | "serie_inactifs_en_cours"
  | "deja_recu"
  | "actif_recemment"
  | "relance_recente"
  | "admin";

export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  sans_email: "Sans email",
  desabonne: "Désabonnés des emails",
  premium_ou_deja_paye: "Premium ou ont déjà payé",
  recherche_terminee: "Ont trouvé (recherche terminée)",
  inscrit_recemment: `Inscrits depuis moins de ${MIN_ACCOUNT_AGE_DAYS} jours`,
  serie_inactifs_en_cours: "En pleine série « inactifs » (1 à 6 emails reçus)",
  deja_recu: "Ont déjà reçu cet email",
  actif_recemment: `Venus sur Stageio ces ${NEWS_INACTIVE_DAYS} derniers jours`,
  relance_recente: "Relancés par l'autre campagne il y a moins de 7 jours",
  admin: "Comptes admin",
};

function baseExclusion(p: CampaignProfile, alreadySent: Set<string>, now: number): ExclusionReason | null {
  if (!p.email) return "sans_email";
  if (isAdminEmail(p.email)) return "admin";
  if (alreadySent.has(p.id)) return "deja_recu";
  if (!p.notify_new_offers) return "desabonne";
  if (isPremium(p) || p.total_paid_cents > 0) return "premium_ou_deja_paye";
  if (p.search_completed_at) return "recherche_terminee";
  if (now - new Date(p.created_at).getTime() < MIN_ACCOUNT_AGE_DAYS * 86_400_000) return "inscrit_recemment";
  if (p.inactive_campaign_emails_sent > 0 && p.inactive_campaign_emails_sent < 7) return "serie_inactifs_en_cours";
  return null;
}

// Nouveautés : en plus, seulement ceux qui ne sont pas venus depuis 7 jours
// (jamais venus depuis le suivi de présence = inactifs), et pas deux emails
// de relance dans la même semaine.
function newsExclusion(
  p: CampaignProfile,
  alreadySent: Set<string>,
  now: number,
  otherRecent: Set<string>,
): ExclusionReason | null {
  const base = baseExclusion(p, alreadySent, now);
  if (base) return base;
  if (p.last_active_at && now - new Date(p.last_active_at).getTime() < NEWS_INACTIVE_DAYS * 86_400_000) {
    return "actif_recemment";
  }
  if (otherRecent.has(p.id)) return "relance_recente";
  return null;
}

export type CampaignId = "offres" | "nouveautes";

export type CampaignDef = {
  id: CampaignId;
  event: string;
  tag: string;
  title: string;
  description: string;
};

export const CAMPAIGNS: Record<CampaignId, CampaignDef> = {
  nouveautes: {
    id: "nouveautes",
    event: NEWS_CAMPAIGN_EVENT,
    tag: NEWS_CAMPAIGN_TAG,
    title: "Relance « nouveautés »",
    description: `Inscrits jamais payants qui ne sont pas venus depuis ${NEWS_INACTIVE_DAYS} jours : nouvelles offres pour eux depuis leur dernière visite, et ce qui a changé sur Stageio.`,
  },
  offres: {
    id: "offres",
    event: CAMPAIGN_EVENT,
    tag: CAMPAIGN_TAG,
    title: "Relance « nouvelles offres » (10/10)",
    description: "Inscrits jamais payants : les offres qui les attendent.",
  },
};

export function campaignFrom(value: unknown): CampaignDef {
  return value === "offres" ? CAMPAIGNS.offres : CAMPAIGNS.nouveautes;
}

export type Audience = {
  totalAccounts: number;
  eligible: CampaignProfile[];
  excluded: Partial<Record<ExclusionReason, number>>;
  sentTotal: number;
  sentLast24h: number;
};

async function fetchSentEvents(db: Db, event: string): Promise<{ user_id: string; created_at: string }[]> {
  return fetchAllRowsByIdCursor((afterId, limit) => {
    let q = db.from("user_events").select("id, user_id, created_at").eq("event_type", event);
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit);
  });
}

// Comptes éligibles, du plus récent au plus ancien : les inscrits récents
// sont les plus susceptibles de revenir, et leurs adresses rebondissent
// moins (bon début pour la réputation du domaine). Le plafond par 24 h
// compte les envois des deux campagnes (réputation du domaine).
export async function loadAudience(db: Db, campaign: CampaignDef = CAMPAIGNS.offres): Promise<Audience> {
  const other = campaign.id === "offres" ? CAMPAIGNS.nouveautes : CAMPAIGNS.offres;
  const [profiles, sent, otherSent] = await Promise.all([
    fetchAllRowsByIdCursor<CampaignProfile>((afterId, limit) => {
      let q = db.from("profiles").select(PROFILE_COLUMNS);
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit) as unknown as PromiseLike<{
        data: CampaignProfile[] | null;
        error: { message: string } | null;
      }>;
    }),
    fetchSentEvents(db, campaign.event),
    fetchSentEvents(db, other.event),
  ]);

  const now = Date.now();
  const alreadySent = new Set(sent.map((e) => e.user_id));
  const otherRecent = new Set(
    otherSent.filter((e) => now - new Date(e.created_at).getTime() < 7 * 86_400_000).map((e) => e.user_id),
  );
  const excluded: Partial<Record<ExclusionReason, number>> = {};
  const eligible: CampaignProfile[] = [];
  for (const p of profiles) {
    const reason =
      campaign.id === "nouveautes" ? newsExclusion(p, alreadySent, now, otherRecent) : baseExclusion(p, alreadySent, now);
    if (reason) excluded[reason] = (excluded[reason] ?? 0) + 1;
    else eligible.push(p);
  }
  eligible.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return {
    totalAccounts: profiles.length,
    eligible,
    excluded,
    sentTotal: alreadySent.size,
    sentLast24h: [...sent, ...otherSent].filter((e) => now - new Date(e.created_at).getTime() < 86_400_000).length,
  };
}

type CatalogOffer = {
  id: string;
  contract_type: ContractType;
  sector: string | null;
  location: string;
  created_at: string;
};

export type Catalog = { offers: CatalogOffer[] };

export async function loadCatalog(db: Db): Promise<Catalog> {
  const offers = await fetchAllRowsByIdCursor<CatalogOffer>((afterId, limit) => {
    let q = db.from("offers").select("id, contract_type, sector, location, created_at").eq("is_active", true);
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit) as unknown as PromiseLike<{
      data: CatalogOffer[] | null;
      error: { message: string } | null;
    }>;
  });
  return { offers };
}

type Zone =
  | { kind: "ville"; label: string; names: string[] }
  | { kind: "departement"; label: string; code: string; name: string }
  | { kind: "france" };

function zoneOf(city: string | null): Zone {
  const trimmed = city?.trim() ?? "";
  if (!trimmed) return { kind: "france" };
  if (isDepartmentLocation(trimmed)) {
    const match = /^(.*) \(([0-9AB]{2,3})\)$/.exec(trimmed);
    if (match) return { kind: "departement", label: trimmed, name: match[1], code: match[2] };
    return { kind: "france" };
  }
  return { kind: "ville", label: trimmed, names: localCitiesFor(trimmed).map((n) => n.toLowerCase()) };
}

function inZone(location: string, zone: Zone): boolean {
  if (zone.kind === "france") return true;
  const loc = location.toLowerCase();
  if (zone.kind === "ville") return zone.names.some((n) => loc.includes(n));
  // France Travail écrit « 69 - LYON 03 », les autres sources le plus souvent
  // « Lyon, Rhône » : le code en tête ou le nom du département.
  return loc.startsWith(`${zone.code.toLowerCase()} - `) || loc.includes(zone.name.toLowerCase());
}

export type ProfileCounts = {
  /** Offres actives qui passent les critères du profil (type, secteurs, zone). */
  matching: number;
  /** Parmi elles, celles arrivées après l'inscription. */
  newSinceSignup: number;
  /** Toutes les offres actives arrivées après l'inscription, sans critère. */
  newOverall: number;
  /** Le profil a au moins un critère : sans critère, « pour toi » = tout le catalogue. */
  hasCriteria: boolean;
  zone: Zone;
};

// « Nouvelles » = arrivées après `since` (l'inscription par défaut, la
// dernière visite pour la campagne nouveautés).
export function countForProfile(catalog: Catalog, p: CampaignProfile, since: string = p.created_at): ProfileCounts {
  const zone = zoneOf(p.city);
  const types = new Set(p.looking_for);
  const sectors = new Set(p.sectors);
  let matching = 0;
  let newSinceSignup = 0;
  let newOverall = 0;
  for (const o of catalog.offers) {
    const isNew = o.created_at > since;
    if (isNew) newOverall++;
    if (types.size > 0 && !types.has(o.contract_type)) continue;
    if (sectors.size > 0 && (!o.sector || !sectors.has(o.sector))) continue;
    if (!inZone(o.location, zone)) continue;
    matching++;
    if (isNew) newSinceSignup++;
  }
  const hasCriteria = types.size === 1 || sectors.size > 0 || zone.kind !== "france";
  return { matching, newSinceSignup, newOverall, hasCriteria, zone };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(fullName: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0] ?? "";
  if (!first || first.length > 30) return null;
  return first;
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

function typePhrase(lookingFor: ContractType[]): string {
  const types = new Set(lookingFor);
  if (types.size === 1 && types.has("alternance")) return "d'alternance";
  if (types.size === 1 && types.has("stage")) return "de stage";
  return "d'alternance et de stage";
}

function zonePhrase(zone: Zone): string {
  if (zone.kind === "ville") return ` à ${zone.label} et autour`;
  if (zone.kind === "departement") return ` côté ${zone.label}`;
  return " partout en France";
}

const CTA_URL = `${SITE_URL}/swipe?utm_source=email&utm_medium=relance&utm_campaign=offres-octobre`;
const PREMIUM_URL = `${SITE_URL}/premium?utm_source=email&utm_medium=relance&utm_campaign=offres-octobre`;
// En dessous, un chiffre « pour toi » fait plus de mal que de bien : on
// parle alors du catalogue entier.
const MIN_COUNT_TO_SHOW = 10;

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderCampaignEmail(
  p: CampaignProfile,
  counts: ProfileCounts,
  totalActive: number,
): RenderedEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `Salut ${name},` : "Salut,";
  const kind = typePhrase(p.looking_for);
  const where = zonePhrase(counts.zone);
  const showCounts = counts.hasCriteria && counts.matching >= MIN_COUNT_TO_SHOW;
  const showNew = showCounts && counts.newSinceSignup >= MIN_COUNT_TO_SHOW;
  // « A beaucoup grossi » seulement si c'est vrai pour CE compte : au moins
  // un cinquième du catalogue actuel est arrivé après son inscription.
  const grew = counts.newOverall >= Math.max(MIN_COUNT_TO_SHOW, totalActive / 5);
  const sectorPart = p.sectors.length > 0 ? " dans tes secteurs" : "";

  const subject = showNew
    ? `${fmt(counts.newSinceSignup)} nouvelles offres ${kind} pour toi depuis ton inscription`
    : showCounts
      ? `${fmt(counts.matching)} offres ${kind} t'attendent sur Stageio`
      : grew
        ? `${fmt(counts.newOverall)} nouvelles offres sur Stageio depuis ton inscription`
        : `Stageio a maintenant ${fmt(totalActive)} offres d'alternance et de stage`;
  const intro = grew
    ? `Depuis ton inscription, Stageio a beaucoup grossi : ${fmt(counts.newOverall)} offres sont arrivées, il y en a maintenant <strong>${fmt(totalActive)}</strong> d'alternance et de stage, mises à jour chaque nuit.`
    : `Stageio compte maintenant <strong>${fmt(totalActive)} offres</strong> d'alternance et de stage, mises à jour chaque nuit.`;

  const forYou = showCounts
    ? `Pour toi, ça fait <strong>${fmt(counts.matching)} offres ${kind}</strong>${sectorPart}${where}${
        showNew ? `, dont <strong>${fmt(counts.newSinceSignup)}</strong> arrivées depuis ton inscription` : ""
      }.`
    : null;
  const forYouText = showCounts
    ? `Pour toi, ça fait ${fmt(counts.matching)} offres ${kind}${sectorPart}${where}${
        showNew ? `, dont ${fmt(counts.newSinceSignup)} arrivées depuis ton inscription` : ""
      }.`
    : null;
  const cityFirst =
    counts.zone.kind === "ville" ? "Et ton fil commence maintenant par les offres de ta ville." : null;

  // Sans prix : ils dépendent du prix de bienvenue de chacun (10 min).
  const premium =
    "Si tu veux aller plus vite : Premium débloque les likes, les candidatures illimitées, la lettre de motivation générée par IA et l'audit de ton CV.";

  const unsubscribeUrl = unsubscribeUrlFor(p.id);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>${intro}</p>
${forYou ? `<p>${forYou}</p>` : ""}
${cityFirst ? `<p>${cityFirst}</p>` : ""}
<p style="margin:24px 0"><a href="${CTA_URL}" style="background:#0c7a44;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Voir mes offres</a></p>
<p>${premium.replace("Premium", `<a href="${PREMIUM_URL}">Premium</a>`)}</p>
<p>Bonne recherche,<br>Nathan, de Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type, pas de série derrière. <a href="${unsubscribeUrl}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;

  const text = [
    greeting,
    "",
    intro.replace(/<\/?strong>/g, ""),
    ...(forYouText ? ["", forYouText] : []),
    ...(cityFirst ? ["", cityFirst] : []),
    "",
    `Voir mes offres : ${CTA_URL}`,
    "",
    premium,
    PREMIUM_URL,
    "",
    "Bonne recherche,",
    "Nathan, de Stageio",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type, pas de série derrière.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export const NEWS_UTM_CAMPAIGN = "nouveautes-octobre";
const NEWS_UTM = `utm_source=email&utm_medium=relance&utm_campaign=${NEWS_UTM_CAMPAIGN}`;

// Campagne « nouveautés » (23/10) : les nouvelles offres pour lui depuis sa
// dernière visite, puis ce qui a vraiment changé. Pas de prix : ils
// dépendent du prix de bienvenue de chacun (10 min à la 1re visite du
// paywall).
export function renderNewsEmail(p: CampaignProfile, catalog: Catalog): RenderedEmail {
  const since = p.last_active_at ?? p.created_at;
  const sinceLabel = p.last_active_at ? "depuis ta dernière visite" : "depuis ton inscription";
  const counts = countForProfile(catalog, p, since);
  const totalActive = catalog.offers.length;
  const name = firstName(p.full_name);
  const greeting = name ? `Salut ${name},` : "Salut,";
  const kind = typePhrase(p.looking_for);
  const where = zonePhrase(counts.zone);
  const sectorPart = p.sectors.length > 0 ? " dans tes secteurs" : "";
  const showCounts = counts.hasCriteria && counts.matching >= MIN_COUNT_TO_SHOW;
  const showNew = showCounts && counts.newSinceSignup >= MIN_COUNT_TO_SHOW;
  const showNewOverall = counts.newOverall >= MIN_COUNT_TO_SHOW;
  const stageOnly = p.looking_for.length === 1 && p.looking_for[0] === "stage";

  const subject = showNew
    ? `${fmt(counts.newSinceSignup)} nouvelles offres ${kind} pour toi ${sinceLabel}`
    : showNewOverall
      ? `${fmt(counts.newOverall)} nouvelles offres sur Stageio ${sinceLabel}`
      : "Quoi de neuf sur Stageio";

  const offersHtml = `${
    showNewOverall
      ? `<strong>${fmt(counts.newOverall)} nouvelles offres</strong> d'alternance et de stage sont arrivées ${sinceLabel}. `
      : ""
  }Il y en a maintenant <strong>${fmt(totalActive)}</strong>, mises à jour chaque nuit.${
    showCounts
      ? ` Pour toi : <strong>${fmt(counts.matching)} offres ${kind}</strong>${sectorPart}${where}${
          showNew ? `, dont <strong>${fmt(counts.newSinceSignup)}</strong> nouvelles` : ""
        }.`
      : ""
  }`;

  const cvUrl = `${SITE_URL}/outils/${stageOnly ? "cv-stage" : "cv-alternance"}?${NEWS_UTM}`;
  const letterUrl = `${SITE_URL}/outils/${stageOnly ? "lettre-de-motivation-stage" : "lettre-de-motivation-alternance"}?${NEWS_UTM}`;
  const salaryUrl = `${SITE_URL}/outils/simulateur-salaire-alternance?${NEWS_UTM}`;
  const ctaUrl = `${SITE_URL}/swipe?${NEWS_UTM}`;
  const premiumUrl = `${SITE_URL}/premium?${NEWS_UTM}`;

  const news: { html: string; text: string }[] = [
    {
      html: `<strong>CV et lettre de motivation gratuits</strong> : <a href="${cvUrl}">crée ton CV en PDF</a> et <a href="${letterUrl}">ta lettre</a> en quelques minutes.`,
      text: `CV et lettre de motivation gratuits : ton CV en PDF (${cvUrl}) et ta lettre (${letterUrl}) en quelques minutes.`,
    },
    ...(stageOnly
      ? []
      : [
          {
            html: `<strong>Simulateur de salaire</strong> : <a href="${salaryUrl}">combien tu seras payé en alternance</a>, le calcul en 10 secondes.`,
            text: `Simulateur de salaire : combien tu seras payé en alternance, le calcul en 10 secondes (${salaryUrl}).`,
          },
        ]),
    {
      html: "<strong>Ta lettre de motivation écrite en direct</strong> pour chaque offre, en quelques secondes (Premium).",
      text: "Ta lettre de motivation écrite en direct pour chaque offre, en quelques secondes (Premium).",
    },
    {
      html: `<strong>Nouvelle garantie Premium</strong> : pas d'entretien au bout de ${GUARANTEE_MONTHS} mois ? <a href="${premiumUrl}">On te rembourse</a> (conditions sur la page Premium).`,
      text: `Nouvelle garantie Premium : pas d'entretien au bout de ${GUARANTEE_MONTHS} mois ? On te rembourse (conditions sur la page Premium : ${premiumUrl}).`,
    },
  ];

  const unsubscribeUrl = unsubscribeUrlFor(p.id);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>Ça fait un moment qu'on ne t'a pas vu sur Stageio. Voilà ce que tu as raté.</p>
<p style="margin:20px 0 4px;font-weight:bold">📬 Les offres</p>
<p style="margin-top:0">${offersHtml}</p>
<p style="margin:20px 0 4px;font-weight:bold">✨ Les nouveautés</p>
<ul style="margin-top:0;padding-left:20px">
${news.map((n) => `<li style="margin-bottom:6px">${n.html}</li>`).join("\n")}
</ul>
<p style="margin:24px 0"><a href="${ctaUrl}" style="background:#0c7a44;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Voir mes nouvelles offres</a></p>
<p>Bonne recherche,<br>Nathan, de Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type, pas de série derrière. <a href="${unsubscribeUrl}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;

  const text = [
    greeting,
    "",
    "Ça fait un moment qu'on ne t'a pas vu sur Stageio. Voilà ce que tu as raté.",
    "",
    "LES OFFRES",
    offersHtml.replace(/<\/?strong>/g, ""),
    "",
    "LES NOUVEAUTÉS",
    ...news.map((n) => `- ${n.text}`),
    "",
    `Voir mes nouvelles offres : ${ctaUrl}`,
    "",
    "Bonne recherche,",
    "Nathan, de Stageio",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type, pas de série derrière.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export function renderForCampaign(campaign: CampaignDef, p: CampaignProfile, catalog: Catalog): RenderedEmail {
  return campaign.id === "nouveautes"
    ? renderNewsEmail(p, catalog)
    : renderCampaignEmail(p, countForProfile(catalog, p), catalog.offers.length);
}
