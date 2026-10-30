// Intitulé de l'offre tel qu'il entre dans une lettre (30/10) : les lettres
// ajoutent déjà « en alternance » / « en stage », or beaucoup d'annonces
// l'écrivent dans le titre (« Vendeur en alternance (H/F) »), ce qui donnait
// « Vendeur en alternance (H/F) en alternance chez … » dans chaque
// candidature envoyée par Stageio Auto. On retire « (H/F) » et le type de
// contrat ; si rien d'utile ne reste, on garde le titre sans « (H/F) ».

const GENDER = /\(\s*[hf]\s*\/\s*[hf]\s*\)|\b[hf]\s*\/\s*[hf]\b/gi;
// En alternance, le mot désigne toujours le contrat, où qu'il soit.
const ALTERNANCE = /\b(?:en\s+)?(?:alternance|apprentissage|contrat\s+(?:d['’]\s*)?(?:apprentissage|professionnalisation)|contrat\s+pro)\b/gi;
// En stage, seulement en tête ou en fin : « Stage de fin d'études » reste tel quel.
const STAGE_START = /^\s*(?:stage|stagiaire)\b(?!\s+(?:de|d['’]|en)\b)\s*[-–—:|]?\s*/i;
const STAGE_END = /\s*[-–—:|]?\s*(?:\(\s*)?(?:en\s+)?(?:stage|stagiaire)(?:\s*\))?\s*$/i;

function tidy(text: string): string {
  return text
    .replace(/\(\s*\)/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/(\s*[-–—|:,/]\s*){2,}/g, " - ")
    .replace(/^[\s\-–—|:,/]+|[\s\-–—|:,/]+$/g, "")
    .trim();
}

export function letterJobTitle(title: string, contractType: string | null | undefined): string {
  const base = tidy(title.replace(GENDER, " "));
  const stripped =
    contractType === "alternance" ? tidy(base.replace(ALTERNANCE, " ")) : tidy(base.replace(STAGE_START, "").replace(STAGE_END, ""));
  return stripped.length >= 3 ? stripped : base;
}
