import { normalizeTitle } from "@/lib/seo/metiers";

// Annonceurs qui ne sont PAS des employeurs :
// - écoles et organismes de formation qui publient des "offres" pour remplir
//   leurs cursus (ex. "Iscod Alternance" : 9 des 29 offres "commercial à
//   Paris" le 06/10), CFA, chambres de métiers ;
// - sites d'emploi qui republient des annonces (Ouest-France Emploi, Direct
//   Emploi, Hosco...) ;
// - noms vides ou génériques ("Entreprise non communiquée", "LTD").
// On ne les affiche jamais comme "entreprises qui recrutent" et ils n'ont pas
// de page /entreprises. Les offres elles-mêmes restent dans le catalogue
// (décision produit à part). Pas de "institut" ni "campus" seuls : Institut
// Pasteur, Campus France... recrutent vraiment. Liste revue sur le sitemap
// de prod du 06/10.
const NON_EMPLOYER_PATTERN = new RegExp(
  [
    // écoles / formation
    "\\becole\\b", "\\bschool\\b", "\\biscod\\b", "\\bstudi\\b", "openclassrooms", "\\bcfa\\b", "\\bacademie\\b", "\\bacademy\\b",
    "\\biscom\\b", "\\befap\\b", "\\bifag\\b", "\\biscpa\\b", "\\bpigier\\b", "\\baftec\\b", "\\bieft\\b", "\\becema\\b", "\\beductive\\b",
    "nextadvance", "\\bionis\\b", "\\bsup de (co|vente|pub)\\b", "digital college", "\\bigs\\b", "\\bipac\\b", "\\besgci\\b", "\\besg\\b",
    "\\bmbway\\b", "\\bcesi\\b", "\\bformation\\b", "\\beducation\\b", "\\bapprentissage\\b", "\\bafpa\\b", "\\baftral\\b",
    "\\bicademie\\b", "\\beuridis\\b", "\\binhni\\b", "suptertiaire", "\\bcampus pro\\b", "\\bcmar\\b", "chambre de metiers",
    "\\boktogone\\b", "\\bief2i\\b", "\\balternance\\b",
    // sites d'emploi
    "\\bemploi\\b", "\\bhosco\\b", "\\bjobteaser\\b", "\\bindeed\\b", "\\bhellowork\\b",
    // noms vides
    "non communique", "confidentiel", "^(ltd|sas|sarl|sa|eurl)$",
  ].join("|"),
);

export function isSchool(company: string): boolean {
  const name = normalizeTitle(company).trim();
  return name.length < 3 || NON_EMPLOYER_PATTERN.test(name);
}
