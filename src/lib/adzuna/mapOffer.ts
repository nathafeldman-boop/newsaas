import type { AdzunaJob } from "@/lib/adzuna/client";
import type { ContractType, OfferSource } from "@/types/database";
import { classifyContractType as classifyContractTypeFromText, guessSector } from "@/lib/offers/classifyContract";

// Classification/secteur : logique partagée avec les autres sources
// agrégées (voir lib/offers/classifyContract.ts, extrait d'ici le 28/09 au
// moment d'ajouter France Travail). Adzuna n'a pas de champ dédié fiable
// pour les contrats français, donc on retombe sur le texte de l'annonce.
export function classifyContractType(job: AdzunaJob): ContractType | null {
  return classifyContractTypeFromText(`${job.title} ${job.description}`);
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
    sector: guessSector(job.category?.label, job.title, job.description),
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
