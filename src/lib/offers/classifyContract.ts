import type { ContractType } from "@/types/database";

// Extrait de lib/adzuna/mapOffer.ts (28/09) au moment d'ajouter la source
// France Travail : les deux agrégateurs n'ont pas de champ dédié fiable
// pour distinguer alternance/stage ni pour rattacher un secteur précis --
// même logique texte (titre + description) réutilisable telle quelle,
// indépendamment de la source.

// Secteur : voir lib/offers/sectors.ts (toutes les valeurs de SECTORS).
export { guessSector } from "@/lib/offers/sectors";

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
// Postes qui parlent de stages ou d'alternance sans en être : personnel
// des écoles et CFA (« Gestionnaire de contrats d'apprentissage »,
// « Chargé d'apprentissage », « Coordinatrice de stages de formation »,
// « Enseignant responsable de la filière par apprentissage »), centres de
// langues, apprentissage automatique (machine learning).
const NOT_A_PLACEMENT = new RegExp(
  [
    /\b(hors|sauf|pas de) (stages?|alternances?)\b/,
    /\b(gestionnaire|coordinat\w+|responsable|charge|chargee|referent\w*)( [\w'-]+){0,3} (des|de|du service des) (stages|alternances|apprentis)\b/,
    /\bdeveloppeu\w+ (de l.)?apprentissage\b/,
    /\bgestionnaire (de |des )?contrats? d.apprentissage\b/,
    /\bcharge(e|\(e\))? d.apprentissage\b/,
    /\bcentre d.apprentissage\b/,
    /\bapprentissage (automatique|de l.anglais|des langues)\b/,
    /\bfiliere (par |en )?(l.)?apprentissage\b/,
    /\bateliers? stages?\b/,
    /\bstages de formation\b/,
  ]
    .map((pattern) => pattern.source)
    .join("|"),
);

// Intitulé d'un poste qui n'est ni une alternance ni un stage (voir
// NOT_A_PLACEMENT) : sert aussi à retirer du catalogue les offres importées
// avant que la règle n'existe.
export function isNotAPlacementTitle(title: string): boolean {
  return NOT_A_PLACEMENT.test(normalizeForContract(title));
}
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

