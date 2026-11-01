import type { Offer } from "@/types/database";
import { isSchoolAd } from "@/lib/seo/schools";

// Publications LinkedIn (Nathan, 1/11 : « publier régulièrement les dernières
// offres d'alternance », « les informations publiées doivent toujours être
// exactes et vérifiables », « vérifie les droits de réutilisation »).
// Ce fichier fixe ce qui peut être publié ; il n'a aucune dépendance base.
//
// Droits de réutilisation (vérifiés le 1/11, voir docs/linkedin.md) :
// - France Travail : offres réutilisables « pour tout usage », republication
//   sur des sites tiers comprise, hors coordonnées ; la source et la date de
//   mise à jour doivent être citées ;
// - La bonne alternance : licence Etalab 2.0 (source à citer) ;
// - offres ajoutées à la main ou depuis le site carrière de l'entreprise :
//   seuls des faits (poste, entreprise, ville, contrat) + un lien ;
// - Adzuna : label « Adzuna » obligatoire sur chaque annonce affichée, licence
//   commerciale au-delà de l'essai, rien sur les réseaux sociaux : exclue.
// On ne publie jamais la description d'une offre ni un contact du recruteur.

export type LinkedinOffer = Pick<
  Offer,
  | "id"
  | "title"
  | "company"
  | "location"
  | "contract_type"
  | "sector"
  | "duration"
  | "start_date"
  | "source"
  | "external_id"
  | "apply_url"
  | "published_at"
  | "last_seen_at"
  | "quality_score"
  | "content_fingerprint"
  | "is_active"
  | "description"
  | "requirements"
>;

/** Colonnes lues pour les candidates (jamais select("*")). */
export const LINKEDIN_OFFER_COLUMNS =
  "id, title, company, location, contract_type, sector, duration, start_date, source, external_id, apply_url, published_at, last_seen_at, quality_score, content_fingerprint, is_active, description, requirements";

/** Sources dont les offres peuvent être publiées. Adzuna et les offres de démonstration : jamais. */
export const LINKEDIN_SOURCES = ["france_travail", "la_bonne_alternance", "manuel", "mistral_ingest"] as const;
const SYNCED_SOURCES = new Set<string>(["france_travail", "la_bonne_alternance"]);

/** Une offre synchronisée doit avoir été revue par la synchro de nuit (ou l'horaire) depuis moins de 48 h. */
export const MAX_UNSEEN_MS = 48 * 3_600_000;
/** Une offre ajoutée à la main n'a pas de synchro : 30 jours au plus, et son lien est vérifié. */
export const MANUAL_MAX_AGE_MS = 30 * 86_400_000;
/** Une offre déjà préparée n'est pas reproposée pendant 60 jours. */
export const REPOST_BLOCK_DAYS = 60;

export type SkipReason =
  | "inactive"
  | "pas_alternance"
  | "source"
  | "entreprise_masquee"
  | "titre"
  | "annonce_ecole"
  | "non_revue"
  | "trop_ancienne"
  | "qualite";

export const SKIP_LABELS: Record<SkipReason, string> = {
  inactive: "Offre retirée",
  pas_alternance: "Pas une alternance",
  source: "Source non publiable (Adzuna…)",
  entreprise_masquee: "Entreprise non communiquée",
  titre: "Intitulé inutilisable",
  annonce_ecole: "Annonce d'école ou de centre de formation",
  non_revue: "Pas revue par la synchro depuis 48 h",
  trop_ancienne: "Ajoutée il y a plus de 30 jours",
  qualite: "Fiche trop incomplète",
};

/** Sous ce score, la fiche est trop vide pour être mise en avant (voir MIN_QUALITY_FOR_FEED). */
const MIN_QUALITY = 30;

const MASKED_COMPANY = /non communiqu|confidenti|anonym|nom de l.entreprise|^entreprise$|^n\/?a$/i;

/** Raison pour laquelle l'offre ne peut pas être publiée, ou null si elle le peut. */
export function skipReason(offer: LinkedinOffer, now: number): SkipReason | null {
  if (!offer.is_active) return "inactive";
  if (offer.contract_type !== "alternance") return "pas_alternance";
  if (!(LINKEDIN_SOURCES as readonly string[]).includes(offer.source)) return "source";
  const company = (offer.company ?? "").trim();
  if (company.length < 2 || MASKED_COMPANY.test(company)) return "entreprise_masquee";
  if ((offer.title ?? "").trim().length < 4) return "titre";
  if (isSchoolAd({ company, description: offer.description, requirements: offer.requirements })) return "annonce_ecole";
  if (SYNCED_SOURCES.has(offer.source)) {
    if (now - Date.parse(offer.last_seen_at) > MAX_UNSEEN_MS) return "non_revue";
  } else if (now - Date.parse(offer.published_at) > MANUAL_MAX_AGE_MS) {
    return "trop_ancienne";
  }
  if ((offer.quality_score ?? 0) < MIN_QUALITY) return "qualite";
  return null;
}

/** Source à citer dans le post, d'après les offres choisies (France Travail et La bonne alternance l'exigent). */
export function sourceLine(offers: Pick<LinkedinOffer, "source">[]): string {
  const names: string[] = [];
  const add = (name: string) => names.includes(name) || names.push(name);
  for (const o of offers) {
    if (o.source === "france_travail") add("France Travail");
    else if (o.source === "la_bonne_alternance") add("La bonne alternance");
    else add("sites carrières des entreprises");
  }
  return names.join(", ");
}
