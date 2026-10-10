import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { isDepartmentLocation } from "@/lib/onboarding/options";
import { localCitiesFor } from "@/lib/matching/score";
import { SITE_URL } from "@/lib/site";
import { unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import type { ContractType, Database } from "@/types/database";

// Relance ponctuelle des inscrits qui n'ont jamais payé (10/10) : UN email,
// envoyé par lots depuis /admin/relance, jamais automatiquement. Chaque
// envoi est noté dans user_events (CAMPAIGN_EVENT) : un compte ne reçoit
// jamais cet email deux fois, et la série « inactifs » (cron
// inactive-winback) saute les comptes qui l'ont reçu dans les 7 jours.
//
// Les chiffres de l'email sont calculés pour chaque profil avec les mêmes
// critères que le deck (type de contrat, secteurs, ville et agglomération) :
// jamais un nombre générique présenté comme « pour toi ».

export const CAMPAIGN_EVENT = "email_relance_offres_2026_10";
export const CAMPAIGN_TAG = "relance_offres_2026_10";
// Au-delà, l'envoi du jour est refusé : un domaine qui envoie quelques
// centaines d'emails par jour et passe d'un coup à 3 000 finit en spam.
export const MAX_SENT_PER_24H = 1000;
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
};

const PROFILE_COLUMNS =
  "id, email, full_name, city, sectors, looking_for, subscription_status, total_paid_cents, notify_new_offers, search_completed_at, inactive_campaign_emails_sent, created_at";

export type ExclusionReason =
  | "sans_email"
  | "desabonne"
  | "premium_ou_deja_paye"
  | "recherche_terminee"
  | "inscrit_recemment"
  | "serie_inactifs_en_cours"
  | "deja_recu"
  | "admin";

export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  sans_email: "Sans email",
  desabonne: "Désabonnés des emails",
  premium_ou_deja_paye: "Premium ou ont déjà payé",
  recherche_terminee: "Ont trouvé (recherche terminée)",
  inscrit_recemment: `Inscrits depuis moins de ${MIN_ACCOUNT_AGE_DAYS} jours`,
  serie_inactifs_en_cours: "En pleine série « inactifs » (1 à 6 emails reçus)",
  deja_recu: "Ont déjà reçu cet email",
  admin: "Comptes admin",
};

function exclusionReason(p: CampaignProfile, alreadySent: Set<string>, now: number): ExclusionReason | null {
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

export type Audience = {
  totalAccounts: number;
  eligible: CampaignProfile[];
  excluded: Partial<Record<ExclusionReason, number>>;
  sentTotal: number;
  sentLast24h: number;
};

async function fetchSentEvents(db: Db): Promise<{ user_id: string; created_at: string }[]> {
  return fetchAllRowsByIdCursor((afterId, limit) => {
    let q = db.from("user_events").select("id, user_id, created_at").eq("event_type", CAMPAIGN_EVENT);
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit);
  });
}

// Comptes éligibles, du plus récent au plus ancien : les inscrits récents
// sont les plus susceptibles de revenir, et leurs adresses rebondissent
// moins (bon début pour la réputation du domaine).
export async function loadAudience(db: Db): Promise<Audience> {
  const [profiles, sent] = await Promise.all([
    fetchAllRowsByIdCursor<CampaignProfile>((afterId, limit) => {
      let q = db.from("profiles").select(PROFILE_COLUMNS);
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit) as unknown as PromiseLike<{
        data: CampaignProfile[] | null;
        error: { message: string } | null;
      }>;
    }),
    fetchSentEvents(db),
  ]);

  const now = Date.now();
  const alreadySent = new Set(sent.map((e) => e.user_id));
  const excluded: Partial<Record<ExclusionReason, number>> = {};
  const eligible: CampaignProfile[] = [];
  for (const p of profiles) {
    const reason = exclusionReason(p, alreadySent, now);
    if (reason) excluded[reason] = (excluded[reason] ?? 0) + 1;
    else eligible.push(p);
  }
  eligible.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return {
    totalAccounts: profiles.length,
    eligible,
    excluded,
    sentTotal: alreadySent.size,
    sentLast24h: sent.filter((e) => now - new Date(e.created_at).getTime() < 86_400_000).length,
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

export function countForProfile(catalog: Catalog, p: CampaignProfile): ProfileCounts {
  const zone = zoneOf(p.city);
  const types = new Set(p.looking_for);
  const sectors = new Set(p.sectors);
  let matching = 0;
  let newSinceSignup = 0;
  let newOverall = 0;
  for (const o of catalog.offers) {
    const isNew = o.created_at > p.created_at;
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

  const premium =
    "Si tu veux aller plus vite : Premium débloque les likes, les candidatures illimitées, la lettre de motivation générée par IA et l'audit de ton CV. 7,99 € par mois sans engagement, ou 39,99 € une seule fois pour un accès à vie.";

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
