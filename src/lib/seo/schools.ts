import { normalizeTitle } from "@/lib/seo/metiers";

// Écoles et organismes de formation qui publient des "offres" sur les
// agrégateurs pour recruter des étudiants dans LEURS cursus (ex. "Iscod
// Alternance", 9 des 29 offres "commercial à Paris" le 06/10). Ce ne sont pas
// des employeurs : on ne les affiche jamais comme "entreprises qui recrutent"
// et ils n'ont pas de page /entreprises. Les offres elles-mêmes restent dans
// le catalogue (décision produit à part). Liste volontairement prudente --
// mieux vaut laisser passer une école que masquer un vrai employeur (pas
// de "institut" ni "campus" : Institut Pasteur, Campus France... recrutent).
const SCHOOL_PATTERN =
  /\b(ecole|school|iscod|studi|openclassrooms|\bcfa\b|academie|academy|business school|iscom|efap|ifag|iscpa|pigier|aftec|ieft|ecema|eductive|nextadvance|ionis|sup de (co|vente|pub)|digital college|groupe igs|igs|ipac|esgci|esg\b|mbway|cesi|alternance (recrutement|formation))\b/;

export function isSchool(company: string): boolean {
  const name = normalizeTitle(company);
  return SCHOOL_PATTERN.test(name) || /\balternance\b/.test(name);
}
