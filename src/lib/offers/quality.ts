// Score de qualité d'une offre (0-100), calculé une fois à l'ingestion et
// stocké (offers.quality_score) plutôt que recalculé à chaque affichage --
// sert de filtre SQL direct côté /swipe et les emails de nouvelles offres
// (voir RETENTION_AUDIT.md, section "qualité des offres"). Différent du
// score de matching (computeMatchScore, src/lib/matching/score.ts) : la
// qualité mesure "cette offre est-elle complète et exploitable", pas
// "correspond-elle à CE profil" -- une offre peut être excellente pour
// personne en particulier tout en étant mal renseignée (pas de description,
// pas de ville exploitable), et c'est justement ce que ce score attrape.
//
// Base à 40 (pas 0) : une offre minimale mais valide (titre, entreprise,
// ville, description non vide -- déjà garanti par les contraintes NOT NULL
// de la table) reste montrable, elle n'a juste rien pour se démarquer.

type QualityInput = {
  description: string;
  requirements: string | null;
  salary: string | null;
  duration: string | null;
  remote_policy: string | null;
  // Absents pour les offres Adzuna (l'API ne fournit ni l'un ni l'autre) --
  // optionnels plutôt que "string | null" pour rester assignable depuis les
  // deux formes d'offre mappées (MappedOffer côté Adzuna, extraction Mistral).
  start_date?: string | null;
  education_level?: string | null;
  sector: string | null;
  apply_url: string | null;
};

export function computeOfferQualityScore(offer: QualityInput): number {
  let score = 40;

  const descLength = offer.description?.trim().length ?? 0;
  if (descLength >= 400) score += 16;
  else if (descLength >= 150) score += 10;
  else if (descLength < 60) score -= 10; // quasi vide : peu exploitable pour candidater

  if (offer.requirements && offer.requirements.trim().length >= 30) score += 10;
  if (offer.salary) score += 8;
  if (offer.duration) score += 6;
  if (offer.remote_policy) score += 4;
  if (offer.start_date) score += 6;
  if (offer.education_level) score += 4;
  if (offer.sector) score += 8; // sans secteur : jamais montrée par le filtre dur de /swipe, donc peu utile
  if (offer.apply_url) score += 8; // sans lien, candidater dessus est impossible

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Seuil sous lequel une offre ne rentre plus dans le pool de candidats du
// feed ni dans les emails de nouvelles offres -- reste dans la table (jamais
// supprimée, cohérent avec le reste du produit) mais devient invisible côté
// utilisateur tant qu'elle n'est pas complétée. Volontairement bas (30, pas
// 50) : mieux vaut pécher par excès d'inclusion tant que le volume d'offres
// reste modeste (voir RETENTION_AUDIT.md) -- un seuil trop strict viderait
// le catalogue avant même que le filtre secteur/pertinence n'entre en jeu.
export const MIN_QUALITY_FOR_FEED = 30;
