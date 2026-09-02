import type { AdzunaJob } from "@/lib/adzuna/client";
import type { ContractType, OfferSource } from "@/types/database";

const SECTOR_KEYWORDS: Record<string, RegExp> = {
  Informatique: /\b(it|software|developer|développeur|informatique|tech)\b/i,
  Marketing: /\b(marketing|communication|digital)\b/i,
  Vente: /\b(sales|vente|commercial)\b/i,
  Design: /\b(design|creative|ux|ui)\b/i,
  Data: /\b(data|analyst|analytics)\b/i,
  Produit: /\b(product|produit)\b/i,
  RH: /\b(hr|human resources|ressources humaines|recrutement)\b/i,
  Finance: /\b(finance|accounting|comptab)\b/i,
  BTP: /\b(construction|btp|trade|bâtiment)\b/i,
};

function guessSector(categoryLabel?: string): string | null {
  if (!categoryLabel) return null;
  for (const [sector, pattern] of Object.entries(SECTOR_KEYWORDS)) {
    if (pattern.test(categoryLabel)) return sector;
  }
  return null;
}

const ALTERNANCE_PATTERN =
  /\b(alternance|alternant|apprentissage|apprenti|contrat de professionnalisation)\b/i;
const STAGE_PATTERN = /\b(stage|stagiaire|internship|intern)\b/i;

/**
 * Classe une offre Adzuna en "alternance" ou "stage" à partir du titre et de
 * la description (Adzuna n'a pas de champ dédié pour les contrats français).
 * Retourne null si l'offre ne correspond clairement à aucun des deux — dans
 * ce cas on la rejette plutôt que de deviner.
 */
export function classifyContractType(job: AdzunaJob): ContractType | null {
  const text = `${job.title} ${job.description}`;
  const isAlternance = ALTERNANCE_PATTERN.test(text);
  const isStage = STAGE_PATTERN.test(text);
  if (isAlternance && !isStage) return "alternance";
  if (isStage && !isAlternance) return "stage";
  if (isAlternance && isStage) {
    // Les deux mots apparaissent (ex: "ouvert aux stagiaires et alternants") :
    // on tranche sur celui qui apparaît en premier, généralement le plus
    // représentatif du titre du poste.
    const posAlt = text.search(ALTERNANCE_PATTERN);
    const posStage = text.search(STAGE_PATTERN);
    return posAlt <= posStage ? "alternance" : "stage";
  }
  return null;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export interface MappedOffer {
  title: string;
  company: string;
  location: string;
  contract_type: ContractType;
  sector: string | null;
  description: string;
  requirements: null;
  duration: null;
  salary: string | null;
  remote_policy: null;
  apply_url: string;
  source: OfferSource;
  source_url: string;
  external_id: string;
  is_active: true;
  published_at: string;
}

export function mapAdzunaJob(job: AdzunaJob): MappedOffer | null {
  const contractType = classifyContractType(job);
  if (!contractType) return null;
  if (!job.title || !job.company?.display_name || !job.location?.display_name) {
    return null;
  }

  const salary =
    job.salary_min && job.salary_max
      ? `${Math.round(job.salary_min)}-${Math.round(job.salary_max)}€`
      : null;

  return {
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    contract_type: contractType,
    sector: guessSector(job.category?.label),
    description: stripHtml(job.description).slice(0, 4000),
    requirements: null,
    duration: null,
    salary,
    remote_policy: null,
    apply_url: job.redirect_url,
    source: "adzuna",
    source_url: job.redirect_url,
    external_id: job.id,
    is_active: true,
    published_at: job.created,
  };
}
