import type { LbaJob } from "@/lib/laBonneAlternance/client";
import { guessSector, isNotAPlacementTitle } from "@/lib/offers/classifyContract";
import { getDepartement } from "@/lib/seo/departements";
import type { OfferSource } from "@/types/database";

// Offre La bonne alternance → ligne de la table offers. On ne garde que les
// offres auxquelles l'API sait envoyer une candidature (apply.recipient_id) :
// c'est tout l'intérêt de la source, le like y envoie vraiment la
// candidature. external_id = recipient_id, réutilisé tel quel à l'envoi.

export type MappedLbaOffer = {
  title: string;
  company: string;
  location: string;
  contract_type: "alternance";
  sector: string | null;
  description: string;
  requirements: string | null;
  duration: string | null;
  salary: null;
  remote_policy: string | null;
  start_date: string | null;
  education_level: string | null;
  apply_url: string;
  source: OfferSource;
  source_url: string;
  external_id: string;
  is_active: true;
  published_at: string;
};

// Niveau européen du diplôme visé → niveaux du matching (lib/matching/score.ts).
const EDUCATION_BY_EUROPEAN_LEVEL: Record<string, string> = {
  "4": "Bac",
  "5": "Bac+2",
  "6": "Bac+3",
  "7": "Bac+5",
};

const REMOTE_LABELS: Record<string, string> = { remote: "Télétravail", hybrid: "Hybride" };

// Département d'un code postal (Corse et outre-mer compris).
function departementOfPostalCode(postalCode: string): string {
  if (postalCode.startsWith("97")) return postalCode.slice(0, 3);
  if (postalCode.startsWith("20")) return Number(postalCode) < 20200 ? "2A" : "2B";
  return postalCode.slice(0, 2);
}

// « 12 RUE DE LA PAIX 75002 PARIS » → « 75 - PARIS », même forme que les
// lieux France Travail (lus par departementFromLocation et le filtre de
// ville du deck). À défaut, le département de la recherche.
export function lbaLocation(address: string, searchedDepartement: string): string {
  const match = [...address.replace(/,?\s*France\s*$/i, "").matchAll(/\b(\d{5})\s*,?\s*([^\d,]+)/g)].pop();
  if (match) {
    const city = match[2].replace(/\s+cedex.*$/i, "").trim();
    if (city) return `${departementOfPostalCode(match[1])} - ${city}`;
  }
  const departement = getDepartement(searchedDepartement);
  return `${searchedDepartement} - ${departement?.name ?? searchedDepartement}`;
}

function section(label: string, items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length > 0 ? `\n\n${label} :\n${clean.map((item) => `- ${item}`).join("\n")}` : "";
}

export function mapLbaJob(job: LbaJob, searchedDepartement: string, seenAt: string): MappedLbaOffer | null {
  const recipientId = job.apply?.recipient_id?.trim();
  const title = job.offer?.title?.trim();
  if (!recipientId || !title || job.offer.status !== "Active" || isNotAPlacementTitle(title)) return null;

  const workplace = job.workplace;
  const company = (workplace.brand || workplace.name || workplace.legal_name || "").trim() || "Entreprise non communiquée";
  const description = (
    (job.offer.description?.trim() || "") +
    section("Ce que tu vas apprendre", job.offer.to_be_acquired_skills ?? []) +
    section("Conditions d'accès", job.offer.access_conditions ?? [])
  )
    .trim()
    .slice(0, 4000);
  if (!description) return null;

  const skills = (job.offer.desired_skills ?? []).map((s) => s.trim()).filter(Boolean);
  const duration = job.contract?.duration;

  return {
    title,
    company,
    location: lbaLocation(workplace.location?.address ?? "", searchedDepartement),
    contract_type: "alternance",
    sector: guessSector(workplace.domain?.naf?.label, title, description),
    description,
    requirements: skills.length > 0 ? skills.join(" · ").slice(0, 1000) : null,
    duration: duration ? `${duration} mois` : null,
    salary: null,
    remote_policy: job.contract?.remote ? (REMOTE_LABELS[job.contract.remote] ?? null) : null,
    start_date: job.contract?.start ? job.contract.start.slice(0, 10) : null,
    education_level: job.offer.target_diploma ? (EDUCATION_BY_EUROPEAN_LEVEL[job.offer.target_diploma.european] ?? null) : null,
    apply_url: job.apply.url,
    source: "la_bonne_alternance",
    source_url: job.apply.url,
    external_id: recipientId,
    is_active: true,
    published_at: job.offer.publication?.creation ?? seenAt,
  };
}
