import type { Offer, Profile } from "@/types/database";

// Score heuristique (pas de ML) : part d'une base de 50 et ajoute des points
// selon le recoupement secteur / métier / localisation / compétences / niveau
// d'études. Plafonné à 99 pour ne jamais promettre un match "parfait", et
// jamais en dessous de 35 pour rester crédible sur une échelle de %.
export function computeMatchScore(profile: Profile, offer: Offer): number {
  let score = 50;

  if (offer.sector && profile.sectors.includes(offer.sector)) {
    score += 20;
  }

  const titleLower = offer.title.toLowerCase();
  if (
    profile.target_jobs.some((job) => titleLower.includes(job.toLowerCase()))
  ) {
    score += 10;
  }

  const cityLower = profile.city?.toLowerCase().trim();
  if (cityLower && offer.location.toLowerCase().includes(cityLower)) {
    score += 15;
  } else if (
    profile.mobility === "Mobile en France" ||
    profile.mobility === "Full remote" ||
    offer.remote_policy === "remote"
  ) {
    score += 8;
  }

  if (profile.skills.length > 0) {
    const offerText = `${offer.description} ${offer.requirements ?? ""}`.toLowerCase();
    const matched = profile.skills.filter((skill) =>
      offerText.includes(skill.toLowerCase()),
    );
    score += Math.round((matched.length / profile.skills.length) * 15);
  }

  if (
    profile.education_level &&
    offer.education_level &&
    profile.education_level === offer.education_level
  ) {
    score += 10;
  }

  return Math.max(35, Math.min(99, Math.round(score)));
}
