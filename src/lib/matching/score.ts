import type { Offer, Profile } from "@/types/database";

const EDUCATION_RANK: Record<string, number> = {
  Bac: 1,
  "Bac+2": 2,
  "Bac+3": 3,
  "Bac+4": 4,
  "Bac+5": 5,
  "Bac+6 et plus": 6,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// \b ne marche pas bien avec les accents français (é, è...) car ce ne sont
// pas des "word characters" par défaut en JS. On borne plutôt avec des
// séparateurs explicites (début/fin de chaîne ou non-lettre) pour éviter les
// faux positifs du type "R" qui matcherait dans "Marketing".
function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`,
    "iu",
  );
  return pattern.test(haystack);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay;
}

// Score heuristique (pas de ML) : part d'une base de 40 et ajoute des points
// selon le recoupement secteur / métier / localisation / compétences / niveau
// d'études / disponibilité. Plafonné à 99 pour ne jamais promettre un match
// "parfait", et jamais en dessous de 30 pour rester crédible sur une échelle
// de %.
export function computeMatchScore(profile: Profile, offer: Offer): number {
  let score = 40;

  // Type de contrat recherché (stage/alternance/les deux à l'onboarding) :
  // un signal direct et sans ambiguïté, jamais pris en compte auparavant.
  if (profile.looking_for.length > 0 && profile.looking_for.includes(offer.contract_type)) {
    score += 8;
  }

  // Secteur (le plus fort signal : c'est le domaine explicitement choisi)
  if (offer.sector && profile.sectors.includes(offer.sector)) {
    score += 18;
  }

  // Métier recherché : mot entier dans le titre, pas une simple sous-chaîne
  if (profile.target_jobs.some((job) => containsWholeWord(offer.title, job))) {
    score += 10;
  }

  // Localisation / mobilité
  const cityLower = profile.city?.toLowerCase().trim();
  if (cityLower && offer.location.toLowerCase().includes(cityLower)) {
    score += 14;
  } else if (
    profile.mobility === "Mobile en France" ||
    profile.mobility === "Full remote" ||
    offer.remote_policy === "remote"
  ) {
    score += 8;
  } else if (profile.mobility === "Mobile dans la région") {
    score += 4;
  }

  // Compétences : proportion de compétences du profil retrouvées (mot entier)
  // dans la description/les prérequis de l'offre.
  if (profile.skills.length > 0) {
    const offerText = `${offer.description} ${offer.requirements ?? ""}`;
    const matched = profile.skills.filter((skill) =>
      containsWholeWord(offerText, skill),
    );
    score += Math.round((matched.length / profile.skills.length) * 16);
  }

  // Niveau d'études : correspondance exacte pleine, surqualifié partielle,
  // sous-qualifié aucun bonus (l'offre demande probablement plus que ce que
  // le profil a acquis).
  if (profile.education_level && offer.education_level) {
    const profileRank = EDUCATION_RANK[profile.education_level];
    const offerRank = EDUCATION_RANK[offer.education_level];
    if (profileRank && offerRank) {
      if (profileRank === offerRank) score += 10;
      else if (profileRank > offerRank) score += 5;
    }
  }

  // Disponibilité : bonus si le profil est dispo avant/autour du début de
  // l'offre, dégressif au-delà d'un mois d'écart.
  if (profile.availability_date && offer.start_date) {
    const diff = daysBetween(profile.availability_date, offer.start_date);
    if (profile.availability_date <= offer.start_date || diff <= 15) {
      score += 6;
    } else if (diff <= 45) {
      score += 3;
    }
  }

  return Math.max(30, Math.min(99, Math.round(score)));
}
