import type { ContractType, PlacementType } from "@/types/database";

// Libellés des types de contrat, partagés par toutes les pages. CDD et CDI
// ajoutés le 7/11 (Nathan : « plus personne ne cherche d'alternance en ce
// moment, mets la feature CDI CDD »). Les pages SEO programmatiques
// (métier × ville, entreprises, guides) restent propres à l'alternance et
// au stage : voir PlacementType et isPlacementType.

export const CONTRACT_LABEL: Record<ContractType, string> = {
  alternance: "Alternance",
  stage: "Stage",
  cdd: "CDD",
  cdi: "CDI",
};

// « Offres … » : « d'alternance », « de stage », « en CDD », « en CDI ».
export const CONTRACT_OF: Record<ContractType, string> = {
  alternance: "d'alternance",
  stage: "de stage",
  cdd: "en CDD",
  cdi: "en CDI",
};

export const OFFERS_OF_CONTRACT: Record<ContractType, string> = {
  alternance: "offres d'alternance",
  stage: "offres de stage",
  cdd: "offres en CDD",
  cdi: "offres en CDI",
};

export const ALL_CONTRACT_TYPES: ContractType[] = ["cdi", "cdd", "alternance", "stage"];

export function isPlacementType(type: ContractType): type is PlacementType {
  return type === "alternance" || type === "stage";
}

// « ton alternance ou ton CDI », « leur stage » : ce que la personne cherche,
// dans l'ordre de ALL_CONTRACT_TYPES. Liste vide : alternance ou stage.
const NOUN: Record<ContractType, string> = { alternance: "alternance", stage: "stage", cdd: "CDD", cdi: "CDI" };
export function contractNouns(lookingFor: ContractType[], possessive: "ton" | "leur"): string {
  const types = ALL_CONTRACT_TYPES.filter((type) => lookingFor.includes(type));
  const list: ContractType[] = types.length > 0 ? types : ["alternance", "stage"];
  const words = list.map((type) => `${possessive} ${NOUN[type]}`);
  return words.length === 1 ? words[0] : `${words.slice(0, -1).join(", ")} ou ${words[words.length - 1]}`;
}

export const CONTRACT_ICON: Record<ContractType, string> = { cdi: "💼", cdd: "⏱️", alternance: "🎯", stage: "🌱" };
export const CONTRACT_SUB: Record<ContractType, string> = {
  cdi: "Un premier emploi durable, ouvert aux débutants.",
  cdd: "Un contrat de quelques mois, ouvert aux débutants.",
  alternance: "Tu alternes école et entreprise, avec un salaire.",
  stage: "Une expérience de quelques mois pendant tes études.",
};
