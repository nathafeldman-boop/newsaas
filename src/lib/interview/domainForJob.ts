import { targetMetiersOf } from "@/lib/matching/score";
import { INTERVIEW_DOMAINS } from "@/lib/interview/questionBank";

// Domaine du simulateur d'entretien pour un métier ou un intitulé d'offre
// (28/10) : par la taxonomie des métiers (« Commercial(e) sédentaire » →
// Commerce / Vente), là où la simple ressemblance de texte du simulateur
// tombait sur le premier domaine de la liste. Calculé côté serveur : la
// taxonomie reste hors du code envoyé au navigateur.
const DOMAIN_OF_METIER: Record<string, string> = {
  cybersecurite: "cybersecurite",
  securite: "securite_defense",
  data: "data",
  developpeur: "dev",
  informatique: "dev",
  design: "design",
  "ux-ui-designer": "design",
  "community-manager": "marketing",
  marketing: "marketing",
  "e-commerce": "e_commerce",
  communication: "communication",
  evenementiel: "tourisme",
  audiovisuel: "audiovisuel",
  culture: "culture",
  rh: "rh",
  "gestionnaire-de-paie": "rh",
  "charge-de-recrutement": "rh",
  "controle-de-gestion": "gestion",
  comptabilite: "gestion",
  "chef-de-projet": "gestion",
  "assistant-administratif": "gestion",
  "assistant-de-direction": "gestion",
  audit: "audit_conseil",
  assurance: "assurance",
  banque: "banque",
  finance: "finance",
  "relation-client": "support",
  immobilier: "immobilier",
  juridique: "juridique",
  "affaires-publiques": "diplomatie",
  achats: "commerce",
  vente: "commerce",
  commercial: "commerce",
  "business-developer": "commerce",
  "commerce-international": "import_export",
  transport: "transport",
  logistique: "logistique",
  "supply-chain": "logistique",
  qualite: "ingenierie",
  maintenance: "ingenierie",
  production: "ingenierie",
  ingenieur: "ingenierie",
  environnement: "environnement",
  architecture: "architecture_urbanisme",
  plombier: "batiment",
  "artisan-batiment": "batiment",
  btp: "batiment",
  "conducteur-de-travaux": "batiment",
  electricien: "batiment",
  menuiserie: "artisanat",
  fleuriste: "artisanat",
  paysagiste: "agroalimentaire",
  agriculture: "agroalimentaire",
  "mecanique-auto": "automobile",
  laboratoire: "recherche_scientifique",
  boucherie: "metiers_bouche",
  "boulangerie-patisserie": "metiers_bouche",
  tourisme: "tourisme",
  "hotellerie-restauration": "restauration",
  cuisinier: "restauration",
  "coiffure-esthetique": "esthetique_bien_etre",
  coiffure: "esthetique_bien_etre",
  esthetique: "esthetique_bien_etre",
  "mode-textile": "mode",
  "aide-soignant": "sante",
  "petite-enfance": "petite_enfance",
  "educateur-specialise": "sante",
  sante: "sante",
  social: "sante",
  "preparateur-pharmacie": "paramedical",
  "assistant-dentaire": "sante",
  "secretaire-medical": "sante",
};

const KNOWN = new Set(INTERVIEW_DOMAINS.map((d) => d.id));

/** Domaine du simulateur pour ce métier ou cet intitulé, ou null si aucun ne correspond. */
export function interviewDomainFor(hint: string | null | undefined): string | null {
  if (!hint?.trim()) return null;
  const metiers = [...targetMetiersOf([hint])].sort((a, b) => Number(!!b.family) - Number(!!a.family));
  for (const m of metiers) {
    const domain = DOMAIN_OF_METIER[m.slug] ?? (m.family ? DOMAIN_OF_METIER[m.family] : undefined);
    if (domain && KNOWN.has(domain)) return domain;
  }
  return null;
}
