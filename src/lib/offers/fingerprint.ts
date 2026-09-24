import { createHash } from "node:crypto";

// Empreinte de contenu (titre + entreprise), indépendante de la source et de
// l'external_id -- sert à repérer les doublons qu'une simple contrainte
// unique (source, external_id) ne peut pas voir : la même offre trouvée à la
// fois par Adzuna et par la découverte Mistral, ou republiée sous un nouvel
// external_id par le même agrégateur. Volontairement SANS la localisation :
// une même offre est parfois listée deux fois avec un libellé de ville
// légèrement différent ("Paris" vs "Paris 15e"), ce qui aurait cassé le
// rapprochement pour la variation qu'on veut justement détecter.
//
// Normalisation volontairement agressive (accents, casse, ponctuation,
// mentions H/F, espaces multiples) : deux offres identiques publiées à
// quelques jours d'écart varient souvent sur ces détails typographiques
// sans que ce soit une offre différente pour autant.
const NOISE_PATTERN =
  /\b(h\s?\/\s?f|f\s?\/\s?h|h-f|f-h|cdi|cdd|cdic|alternance|alternant|apprentissage|apprenti|stage|stagiaire)\b/gi;

function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(NOISE_PATTERN, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function computeOfferFingerprint(title: string, company: string): string | null {
  const normalizedTitle = normalize(title);
  const normalizedCompany = normalize(company);
  // Un titre ou une entreprise trop court une fois nettoyé (ex: normalisé à
  // rien, ou une seule lettre) ne porte plus assez de signal pour être
  // comparé de façon fiable -- mieux vaut ne pas fingerprinter du tout
  // (colonne nullable) que de regrouper des offres sans rapport sous une
  // empreinte quasi vide.
  if (normalizedTitle.length < 4 || normalizedCompany.length < 2) return null;
  return createHash("sha256").update(`${normalizedTitle}::${normalizedCompany}`).digest("hex").slice(0, 40);
}
