import type { FranceTravailJob } from "@/lib/franceTravail/client";
import type { ContractType, OfferSource } from "@/types/database";
import { classifyOfferContract, guessSector } from "@/lib/offers/classifyContract";

// Même doctrine que mapAdzunaJob (lib/adzuna/mapOffer.ts) : classification
// alternance/stage et secteur devinés sur le texte de l'annonce (voir
// classifyContract.ts, partagé entre les deux sources) plutôt que sur un
// champ structuré de l'API dont on n'a pas pu vérifier la valeur exacte
// depuis ce sandbox (francetravail.io bloqué par le proxy réseau ici) --
// plus lent à filtrer qu'un vrai filtre côté requête, mais fiable qu'importe
// ce que typeContratLibelle contient vraiment.
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

export function mapFranceTravailJob(job: FranceTravailJob): MappedOffer | null {
  if (!job.id || !job.intitule || !job.description) return null;

  const contractType = classifyOfferContract(job.intitule, job.description);
  if (!contractType) return null;

  const company = job.entreprise?.nom?.trim();
  const location = job.lieuTravail?.libelle?.trim();
  // Beaucoup d'offres France Travail anonymisent l'entreprise ("Entreprise
  // du secteur X") -- pas un motif de rejet en soi, contrairement à Adzuna
  // où une entreprise/lieu manquant trahit plutôt une ligne mal formée.
  // Rejette seulement si vraiment rien d'exploitable n'est fourni.
  const applyUrl = job.origineOffre?.urlOrigine ?? job.contact?.urlPostulation ?? null;
  if (!location || !applyUrl) return null;

  return {
    title: job.intitule,
    company: company || "Entreprise non communiquée",
    location,
    contract_type: contractType,
    sector: guessSector(job.typeContratLibelle, job.intitule, job.description),
    description: job.description.slice(0, 4000),
    requirements: null,
    duration: null,
    salary: job.salaire?.libelle?.trim() || null,
    remote_policy: null,
    apply_url: applyUrl,
    source: "france_travail",
    source_url: applyUrl,
    external_id: job.id,
    is_active: true,
    published_at: job.dateCreation,
  };
}
