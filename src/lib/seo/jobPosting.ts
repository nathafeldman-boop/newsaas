import type { Offer } from "@/types/database";

// Google for Jobs exige la description COMPLÈTE du poste dans le JSON-LD et
// sur la page. Adzuna ne fournit qu'un extrait (~500 caractères coupé par
// "…") : un JobPosting tronqué enfreint les consignes (risque d'action
// manuelle sur les données structurées de tout le site). On ne le publie
// donc que pour les offres dont on a le texte intégral (France Travail,
// saisie manuelle) -- voir l'audit SEO du 06/10.
// Google exige le nom réel de l'employeur dans hiringOrganization :
// "Entreprise non communiquée" (France Travail, employeur masqué) n'en est
// pas un.
export const UNNAMED_EMPLOYER = /non communiqu|confidenti|^\s*$/i;

export function isJobPostingEligible(offer: Pick<Offer, "source" | "company" | "description">): boolean {
  if (offer.source === "adzuna" || offer.source === "demo") return false;
  if (UNNAMED_EMPLOYER.test(offer.company)) return false;
  const description = offer.description.trim();
  if (/(…|\.\.\.)$/.test(description)) return false;
  return description.length >= 200;
}
