import { SITE_URL } from "@/lib/site";
import { offerPath } from "@/lib/offers/publicUrl";
import { NOT_A_CITY, normalizeCityKey, preferCityNamedInTitle, slugify, titleCase } from "@/lib/offers/segments";
import { classifyMetier } from "@/lib/seo/metiers";
import { TOP_CITIES } from "@/lib/onboarding/options";
import { cityPhrase } from "@/lib/seo/programmaticIndex";
import { sourceLine, type LinkedinOffer } from "@/lib/linkedin/rules";

// Textes des publications LinkedIn (1/11). Modèles fixes, sans IA : chaque
// ligne vient d'un champ de la base (poste, entreprise, ville, contrat) ou
// d'une phrase écrite ici, donc rien d'inventé. Seuls l'accroche et le titre
// varient d'un jour à l'autre (graine = jour), pour que les publications
// ne se ressemblent pas toutes.

export type PostKind = "daily" | "sector" | "city" | "weekly";

export const KIND_LABELS: Record<PostKind, string> = {
  daily: "Les alternances du jour",
  sector: "Par secteur",
  city: "Par ville",
  weekly: "Récap de la semaine",
};

/** Nombre d'offres par publication. */
export const POST_SIZE: Record<PostKind, number> = { daily: 5, sector: 5, city: 5, weekly: 10 };

// Les 6 secteurs demandés, rattachés aux pages métier qui existent déjà
// (lib/seo/metiers.ts) : l'offre est classée par son intitulé, comme sur le site.
export type SectorGroup = { slug: string; label: string; metiers: string[]; landing: string; hashtags: string[] };
export const SECTOR_GROUPS: SectorGroup[] = [
  { slug: "marketing-communication", label: "marketing et communication", metiers: ["marketing", "communication", "community-manager", "e-commerce"], landing: "marketing", hashtags: ["#marketing", "#communication"] },
  { slug: "commerce", label: "commerce et business development", metiers: ["commercial", "vente", "commerce-international", "relation-client", "achats"], landing: "commercial", hashtags: ["#commerce", "#vente", "#businessdevelopment"] },
  { slug: "rh", label: "ressources humaines", metiers: ["rh"], landing: "rh", hashtags: ["#rh", "#ressourceshumaines"] },
  { slug: "informatique", label: "informatique et développement", metiers: ["informatique", "developpeur", "data", "cybersecurite"], landing: "informatique", hashtags: ["#informatique", "#développement", "#tech"] },
  { slug: "finance", label: "finance et gestion", metiers: ["finance", "comptabilite", "controle-de-gestion", "audit", "banque", "assurance"], landing: "finance", hashtags: ["#finance", "#gestion", "#comptabilité"] },
  { slug: "administration", label: "administration", metiers: ["assistant-administratif", "affaires-publiques"], landing: "assistant-administratif", hashtags: ["#administration", "#assistantadministratif"] },
];

export function sectorGroupFrom(slug: unknown): SectorGroup | null {
  return SECTOR_GROUPS.find((g) => g.slug === slug) ?? null;
}

export function offerInSector(offer: Pick<LinkedinOffer, "title">, group: SectorGroup): boolean {
  const metier = classifyMetier(offer.title);
  return metier !== null && group.metiers.includes(metier.slug);
}

// Villes proposées : celles de l'inscription (Paris, Lyon, Marseille, Toulouse…).
export const LINKEDIN_CITIES = TOP_CITIES.map((label) => ({ slug: slugify(label), label }));

export function cityFrom(slug: unknown): { slug: string; label: string } | null {
  return LINKEDIN_CITIES.find((c) => c.slug === slug) ?? null;
}

// -- Faits d'une offre -------------------------------------------------------

const LOWER_WORDS = new Set(["de", "du", "des", "la", "le", "les", "en", "et", "au", "aux", "sur", "pour", "par", "un", "une", "d", "l", "a"]);

/**
 * Texte écrit tout en capitales -> casse normale. Les sigles sans voyelle (SNCF, RH) et
 * les mots de 3 lettres au plus restent en capitales. `eachWord` : majuscule à chaque mot
 * (noms d'entreprise), sinon seulement au premier (intitulés de poste).
 */
export function prettyCaps(text: string, eachWord = false): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (/\p{Ll}/u.test(clean)) return clean;
  let first = true;
  return clean.replace(/[\p{L}\p{N}'’]+/gu, (word) => {
    const letters = word.replace(/[^\p{L}]/gu, "");
    const keepUpper = letters.length <= 3 ? !LOWER_WORDS.has(word.toLowerCase()) : !/[aeiouyàâäéèêëîïôöùûü]/i.test(letters);
    const lower = word.toLowerCase();
    const capitalise = !keepUpper && (first || (eachWord && !LOWER_WORDS.has(lower)));
    const result = keepUpper ? word : capitalise ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    first = false;
    return result;
  });
}

export function cleanTitle(title: string): string {
  const withoutGender = title.replace(/\s*[(\[]?\s*(h\s*\/\s*f|f\s*\/\s*h)\s*[)\]]?\s*$/i, "");
  const pretty = prettyCaps(withoutGender);
  return pretty.length > 90 ? `${pretty.slice(0, 88).trimEnd()}…` : pretty;
}

export function cleanCompany(company: string): string {
  return prettyCaps(company, true);
}

/** Ville de l'offre (« 75 - PARIS 08 » -> « Paris »), ou null si le lieu n'est pas une ville. */
export function cityOf(offer: Pick<LinkedinOffer, "location" | "title">): string | null {
  const key = normalizeCityKey(preferCityNamedInTitle(offer.location ?? "", offer.title ?? ""));
  if (!key) return null;
  const slug = slugify(key);
  if (!slug || NOT_A_CITY.has(slug)) return null;
  return titleCase(key);
}

export function citySlugOf(offer: Pick<LinkedinOffer, "location" | "title">): string | null {
  const city = cityOf(offer);
  return city ? slugify(city) : null;
}

/** Durée seulement si elle est écrite proprement (« 12 mois », « 2 ans »). */
export function durationOf(offer: Pick<LinkedinOffer, "duration">): string | null {
  const d = offer.duration?.trim() ?? "";
  return /^\d{1,2}\s*(mois|ans?)$/i.test(d) ? d.toLowerCase() : null;
}

export function utmCampaign(kind: PostKind, key: string, now: number): string {
  const day = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  return `${[kind, key].filter(Boolean).join("-")}-${day}`;
}

// ?li= plutôt que ?utm_source=…&utm_campaign=… (6/11) : LinkedIn met en
// italique le texte entre deux « _ », ce qui cassait le lien dans le post.
// Même suivi (voir linkedinCampaign et proxy.ts).
export function linkedinUrl(path: string, campaign: string): string {
  return `${SITE_URL}${path}?li=${encodeURIComponent(campaign)}`;
}

export function offerLink(offer: Pick<LinkedinOffer, "id" | "title" | "company" | "location">, campaign: string): string {
  return linkedinUrl(offerPath(offer), campaign);
}

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });
const LONG_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
const FULL_DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });

const dayNumber = (now: number) => Math.floor(now / 86_400_000);
const chooseVariant = <T>(items: T[], seed: number): T => items[Math.abs(seed) % items.length];

const offersCount = (n: number) => `${n} offre${n > 1 ? "s" : ""}`;

// -- Publication -------------------------------------------------------------

export type PostTarget = {
  /** Libellé du secteur ou de la ville. */
  label: string;
  /** Page Stageio vers laquelle renvoie la fin du post (chemin). */
  landingPath: string;
  /** Nombre d'offres actives du secteur ou de la ville sur Stageio, si connu. */
  count?: number | null;
  hashtags?: string[];
  /** Pour la campagne UTM. */
  key: string;
};

export type PostDraft = {
  kind: PostKind;
  /** Nom court dans l'historique (« Marketing et communication », « Lyon »…). */
  label: string;
  /** Titre du visuel. */
  headline: string;
  /** Sous-titre du visuel. */
  subline: string;
  text: string;
  /** Premier commentaire (liens), seulement si les liens sont mis en commentaire. */
  comment: string | null;
  offerIds: string[];
};

export type BuildInput = {
  kind: PostKind;
  offers: LinkedinOffer[];
  now: number;
  target?: PostTarget | null;
  linksInComment?: boolean;
};

const BASE_TAGS = ["#alternance", "#recrutement", "#emploi", "#étudiants"];

export function buildPost({ kind, offers, now, target = null, linksInComment = false }: BuildInput): PostDraft {
  const n = offers.length;
  const seed = dayNumber(now) + (kind === "daily" ? 0 : kind === "sector" ? 1 : kind === "city" ? 2 : 3);
  const day = DATE_FORMAT.format(now);
  const campaign = utmCampaign(kind, target?.key ?? "", now);
  const landingPath = target?.landingPath ?? "/alternance";
  const landingUrl = linkedinUrl(landingPath, campaign);

  let hook: string;
  let intro: string;
  let closing: string;
  let headline: string;
  let subline: string;
  let label: string;
  switch (kind) {
    case "sector": {
      const sector = target?.label ?? "";
      label = sector.charAt(0).toUpperCase() + sector.slice(1);
      hook = chooseVariant(
        [
          `Alternance en ${sector} : ${offersCount(n)} à saisir`,
          `Tu cherches une alternance en ${sector} ? Voici ${offersCount(n)} à regarder`,
          `${sector.charAt(0).toUpperCase() + sector.slice(1)} : ${offersCount(n)} d'alternance en ligne`,
        ],
        seed,
      );
      intro =
        target?.count && target.count >= n
          ? `${target.count.toLocaleString("fr-FR")} offres d'alternance en ${sector} sont en ligne sur Stageio au ${day}. En voici ${n} :`
          : `Voici ${offersCount(n)} d'alternance en ${sector} en ligne sur Stageio au ${day} :`;
      closing = `Toutes les offres d'alternance en ${sector}`;
      headline = `Alternance en ${sector}`;
      subline = `${offersCount(n)} à saisir`;
      break;
    }
    case "city": {
      const city = target?.label ?? "";
      label = city;
      hook = chooseVariant(
        [
          `Alternance ${cityPhrase(city)} : ${offersCount(n)} à saisir`,
          `Tu cherches une alternance ${cityPhrase(city)} ? Voici ${offersCount(n)} à regarder`,
          `${city} : ${offersCount(n)} d'alternance en ligne`,
        ],
        seed,
      );
      intro =
        target?.count && target.count >= n
          ? `${target.count.toLocaleString("fr-FR")} offres d'alternance ${cityPhrase(city)} sont en ligne sur Stageio au ${day}. En voici ${n} :`
          : `Voici ${offersCount(n)} d'alternance ${cityPhrase(city)} en ligne sur Stageio au ${day} :`;
      closing = `Toutes les offres d'alternance ${cityPhrase(city)}`;
      headline = `Alternance ${cityPhrase(city)}`;
      subline = `${offersCount(n)} à saisir`;
      break;
    }
    case "weekly": {
      label = `Semaine du ${day}`;
      hook = chooseVariant(
        [
          `Le récap de la semaine : ${n} offres d'alternance à ne pas manquer`,
          `Vendredi, c'est sélection : ${n} offres d'alternance de la semaine`,
          `Les ${n} offres d'alternance de la semaine à regarder ce week-end`,
        ],
        seed,
      );
      intro = `Chaque vendredi, une sélection des offres les mieux renseignées publiées cette semaine sur Stageio (en ligne au ${day}) :`;
      closing = "Toutes les offres d'alternance";
      headline = "Les offres de la semaine";
      subline = `${n} offres d'alternance sélectionnées`;
      break;
    }
    default: {
      label = `Du ${day}`;
      hook = chooseVariant(
        [
          `Alternance : les ${n} dernières offres arrivées sur Stageio`,
          `${offersCount(n)} d'alternance à saisir ${LONG_DATE_FORMAT.format(now)}`,
          `Tu cherches une alternance ? Voici ${offersCount(n)} à regarder`,
        ],
        seed,
      );
      intro = `Les dernières offres d'alternance ajoutées sur Stageio, en ligne au ${day} :`;
      closing = "Toutes les offres d'alternance";
      headline = "Les alternances du jour";
      subline = `${LONG_DATE_FORMAT.format(now)}`;
    }
  }

  const items = offers.map((offer, i) => {
    const city = cityOf(offer);
    const duration = durationOf(offer);
    const meta = [`🏢 ${cleanCompany(offer.company)}`, ...(city ? [`📍 ${city}`] : []), `Alternance${duration ? ` ${duration}` : ""}`].join(" · ");
    const url = offerLink(offer, campaign);
    return { title: cleanTitle(offer.title), meta, url, index: i + 1 };
  });

  const tags = [...BASE_TAGS, ...(target?.hashtags ?? [])].join(" ");
  const source = `Sources des offres : ${sourceLine(offers)}.`;

  const body = items.map((it) => (linksInComment ? `${it.index}. ${it.title}\n${it.meta}` : `${it.index}. ${it.title}\n${it.meta}\n👉 ${it.url}`)).join("\n\n");
  const text = linksInComment
    ? [hook, intro, body, "Les liens vers chaque offre sont dans le premier commentaire 👇", source, tags].join("\n\n")
    : [hook, intro, body, `${closing} : ${landingUrl}`, source, tags].join("\n\n");
  const comment = linksInComment
    ? [
        "Les offres, avec le lien vers chaque fiche :",
        items.map((it) => `${it.index}. ${it.title} (${it.meta.split(" · ")[0].replace("🏢 ", "")}) : ${it.url}`).join("\n"),
        `${closing} : ${landingUrl}`,
      ].join("\n\n")
    : null;

  return { kind, label, headline, subline, text, comment, offerIds: offers.map((o) => o.id) };
}

export type VisualRow = { title: string; company: string; city: string | null };

/** Lignes du visuel : 5 offres (10 pour le récap), titres raccourcis pour tenir sur l'image. */
export function visualRows(offers: LinkedinOffer[]): VisualRow[] {
  const cut = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);
  return offers.map((o) => ({ title: cut(cleanTitle(o.title), 56), company: cut(cleanCompany(o.company), 36), city: cityOf(o) }));
}

export const formatFullDate = (now: number) => FULL_DATE_FORMAT.format(now);
