import type { ContractType } from "@/types/database";

// Extrait de lib/adzuna/mapOffer.ts (28/09) au moment d'ajouter la source
// France Travail : les deux agrégateurs n'ont pas de champ dédié fiable
// pour distinguer alternance/stage ni pour rattacher un secteur précis --
// même logique texte (titre + description) réutilisable telle quelle,
// indépendamment de la source.

// Historiquement limité aux 12 secteurs d'origine de l'onboarding -- depuis
// que SECTORS (lib/onboarding/options.ts) est passé à 113 entrées, un profil
// qui choisit un secteur hors de cette liste (ex: "Logistique et transport")
// ne matchait plus jamais aucune offre agrégée : le filtre dur de /swipe
// retombait à 0 résultat et le filet de sécurité (retry sans filtre secteur)
// finissait par montrer des offres complètement hors-sujet, classées
// premières sur d'autres critères (ville, compétences...). Pas la peine de
// couvrir les 113 : on ajoute ici les secteurs les plus probables sur un
// agrégateur généraliste.
// Exporté (en plus de guessSector) pour servir de vocabulaire fermé aux
// pages /offres/secteur/[secteur] -- voir lib/offers/segments.ts.
export const SECTOR_KEYWORDS: Record<string, RegExp> = {
  Informatique: /\b(it|software|developer|développeur|informatique|tech)\b/i,
  Data: /\b(data|analyst|analytics)\b/i,
  Design: /\b(design|creative|ux|ui)\b/i,
  Marketing: /\b(marketing)\b/i,
  Communication: /\b(communication|community manager|relations presse)\b/i,
  Vente: /\b(sales|vente|commercial)\b/i,
  Produit: /\b(product|produit)\b/i,
  RH: /\b(hr|human resources|ressources humaines|recrutement)\b/i,
  Finance: /\b(finance|financial)\b/i,
  BTP: /\b(construction|btp|trade|bâtiment)\b/i,
  Santé: /\b(santé|médical|infirmier|soignant|paramédical)\b/i,
  "Logistique et transport": /\b(logistic|logistique|transport|supply chain|entrepôt|warehouse|chauffeur|magasinier)\b/i,
  Comptabilité: /\b(comptab|accounting)\b/i,
  Immobilier: /\b(immobilier|real estate|property)\b/i,
  Hôtellerie: /\b(hôtel|hotel|hospitality)\b/i,
  Restauration: /\b(restauration|restaurant|cuisine|chef de partie|commis de cuisine)\b/i,
  "Juridique et droit": /\b(juridique|legal|droit des|avocat|notaire|juriste)\b/i,
  Architecture: /\b(architecte|architecture)\b/i,
  Ingénierie: /\b(ingénieur|engineering)\b/i,
  Automobile: /\b(automobile|automotive)\b/i,
  Assurance: /\b(assurance|insurance)\b/i,
  Banque: /\b(banque|banking|bancaire)\b/i,
  Tourisme: /\b(tourisme|tourism)\b/i,
  Événementiel: /\b(événementiel|event manager)\b/i,
  Audiovisuel: /\b(audiovisuel|broadcast)\b/i,
  Mode: /\b(mode|fashion)\b/i,
  Luxe: /\b(luxe|luxury)\b/i,
  Cybersécurité: /\b(cybersécurité|cybersecurity|infosec)\b/i,
  "Intelligence artificielle": /\b(intelligence artificielle|machine learning|deep learning)\b/i,
  Achats: /\b(achats|purchasing|procurement|acheteur)\b/i,
  Qualité: /\b(qualité|quality assurance|quality control)\b/i,
  Électronique: /\b(électronique|electronics)\b/i,
  Énergie: /\b(énergie|energy|renouvelable|renewable)\b/i,
  Agriculture: /\b(agriculture|agricole|farming)\b/i,
  Agroalimentaire: /\b(agroalimentaire|agri-food)\b/i,
  Textile: /\b(textile)\b/i,
  "Développement durable": /\b(développement durable|sustainability|rse\b)\b/i,
  "Éducation et formation": /\b(éducation|enseignant|formateur|formation professionnelle|teacher)\b/i,
  Culture: /\b(culturel|culture)\b/i,
  Sport: /\b(coach sportif|éducateur sportif)\b/i,
  Sécurité: /\b(agent de sécurité|security guard)\b/i,
};

function matchSector(text: string): string | null {
  for (const [sector, pattern] of Object.entries(SECTOR_KEYWORDS)) {
    if (pattern.test(text)) return sector;
  }
  return null;
}

// La catégorie fournie par l'agrégateur (quand il y en a une) est un
// intitulé générique et grossier qui ne recoupe presque jamais nos secteurs
// d'onboarding : s'y fier seul laissait la quasi-totalité des offres sans
// secteur, donc sans aucun bonus/filtre de pertinence côté matching. On
// tente d'abord la catégorie, puis on retombe sur le titre + la description
// de l'annonce elle-même, bien plus discriminants pour une alternance/stage
// donné.
export function guessSector(categoryLabel: string | null | undefined, title: string, description: string): string | null {
  return (categoryLabel && matchSector(categoryLabel)) || matchSector(`${title} ${description}`);
}

const ALTERNANCE_PATTERN =
  /\b(alternance|alternant|apprentissage|apprenti|contrat de professionnalisation)\b/i;
const STAGE_PATTERN = /\b(stage|stagiaire|internship|intern)\b/i;

/**
 * Classe une offre en "alternance" ou "stage" à partir de son texte (titre +
 * description) -- les agrégateurs généralistes n'ont pas de champ dédié
 * fiable pour les contrats français. Retourne null si l'offre ne correspond
 * clairement à aucun des deux -- dans ce cas on la rejette plutôt que de
 * deviner.
 */
export function classifyContractType(text: string): ContractType | null {
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

// Version stricte, utilisée par les synchros (France Travail, Adzuna) : le
// mot « stage » ou « alternance » n'importe où dans la description ne
// suffit plus. Avec la synchro par département (30 fois plus de résultats
// pour le mot-clé « stage »), des CDI passaient pour des stages, y compris
// dans Google Jobs : « Data analyst confirmé, hors stage et alternance »,
// « Gestionnaire du service des stages », « Ingénieur structure » dont
// l'annonce demande une « première expérience (stage ou alternance) ».
// Règle : le titre décide ; sinon il faut une formulation qui désigne
// vraiment le contrat (« contrat d'apprentissage », « convention de
// stage », « stage de 6 mois »...).
const TITLE_ALTERNANCE = /\b(alternance|alternant|alternante|alternants|apprentissage|apprenti|apprentie|apprentis|contrat pro|contrat de professionnalisation)\b/;
const TITLE_STAGE = /\b(stage|stages|stagiaire|stagiaires|internship|intern)\b/;
// Postes qui parlent de stages ou d'alternance sans en être.
const NOT_A_PLACEMENT =
  /\b(hors|sauf|pas de) (stages?|alternances?)\b|\b(gestionnaire|coordinat\w+|responsable|charge|chargee|referent\w*)( [\w'-]+){0,3} (des|du service des) (stages|alternances|apprentis)\b|\bdeveloppeu\w+ (de l.)?apprentissage\b/;
const DESCRIPTION_ALTERNANCE = /contrat d.apprentissage|contrat de professionnalisation|contrat d.alternance|poste (a pourvoir )?en alternance/;
const DESCRIPTION_STAGE =
  /convention de stage|stage conventionne|\bstage (de |d.)?(fin d.etudes|pre.?embauche|obligatoire|\d+ ?(a \d+ )?(mois|semaines))|\bstage de \d/;

function normalizeForContract(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "'");
}

function firstMatch(text: string, alternance: RegExp, stage: RegExp): ContractType | null {
  const posAlt = text.search(alternance);
  const posStage = text.search(stage);
  if (posAlt < 0 && posStage < 0) return null;
  if (posStage < 0) return "alternance";
  if (posAlt < 0) return "stage";
  return posAlt <= posStage ? "alternance" : "stage";
}

export function classifyOfferContract(title: string, description: string): ContractType | null {
  const normalizedTitle = normalizeForContract(title);
  if (NOT_A_PLACEMENT.test(normalizedTitle)) return null;
  const fromTitle = firstMatch(normalizedTitle, TITLE_ALTERNANCE, TITLE_STAGE);
  if (fromTitle) return fromTitle;
  const normalizedDescription = normalizeForContract(description);
  if (/\b(hors|sauf) (stages?|alternances?)\b/.test(normalizedDescription)) return null;
  return firstMatch(normalizedDescription, DESCRIPTION_ALTERNANCE, DESCRIPTION_STAGE);
}

