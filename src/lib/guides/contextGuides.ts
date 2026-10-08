import { classifyFormations, classifyMetier } from "@/lib/seo/metiers";
import type { ContractType } from "@/types/database";

export type GuideLink = { slug: string; label: string };

// Guide propre à un métier ou à un diplôme (pages métier et fiches offres).
export const METIER_GUIDES: Record<string, GuideLink> = {
  "aide-soignant": { slug: "aide-soignant-alternance", label: "Aide-soignant en alternance (DEAS)" },
  "educateur-specialise": { slug: "educateur-specialise-apprentissage", label: "Éducateur spécialisé en apprentissage" },
  "affaires-publiques": { slug: "alternance-fonction-publique", label: "L'alternance dans la fonction publique" },
  bts: { slug: "bts-bachelor-master-alternance", label: "BTS, bachelor ou master en alternance" },
  bachelor: { slug: "bts-bachelor-master-alternance", label: "BTS, bachelor ou master en alternance" },
  master: { slug: "bts-bachelor-master-alternance", label: "BTS, bachelor ou master en alternance" },
  cap: { slug: "alternance-sans-le-bac", label: "Alternance sans le bac : les diplômes accessibles" },
  "bac-pro": { slug: "alternance-sans-le-bac", label: "Alternance sans le bac : les diplômes accessibles" },
  bp: { slug: "alternance-sans-le-bac", label: "Alternance sans le bac : les diplômes accessibles" },
  "titre-pro": { slug: "alternance-sans-le-bac", label: "Alternance sans le bac : les diplômes accessibles" },
};

// Ce qui sert à quelqu'un qui lit une annonce et s'apprête à postuler.
const OFFER_GUIDES: Record<ContractType, GuideLink[]> = {
  alternance: [
    { slug: "entretien-alternance", label: "Réussir l'entretien d'alternance" },
    { slug: "relancer-candidature", label: "Relancer après une candidature" },
    { slug: "contrat-apprentissage-ou-contrat-pro", label: "Apprentissage ou contrat pro ?" },
  ],
  stage: [
    { slug: "entretien-de-stage", label: "Réussir l'entretien de stage" },
    { slug: "convention-de-stage", label: "La convention de stage" },
    { slug: "relancer-candidature", label: "Relancer après une candidature" },
  ],
};

// Fiches offres : le guide du métier ou du diplôme de l'annonce s'il existe,
// puis les guides de candidature. Trois liens au plus.
export function offerGuides(type: ContractType, title: string): GuideLink[] {
  const own =
    type === "alternance"
      ? [classifyMetier(title)?.slug, ...classifyFormations(title).map((f) => (f.slug.startsWith("bts") ? "bts" : f.slug))]
          .map((slug) => (slug ? METIER_GUIDES[slug] : undefined))
          .find((guide): guide is GuideLink => Boolean(guide))
      : undefined;
  const list = own ? [own, ...OFFER_GUIDES[type]] : OFFER_GUIDES[type];
  return list.filter((g, i) => list.findIndex((other) => other.slug === g.slug) === i).slice(0, 3);
}
