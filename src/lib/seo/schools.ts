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
const SCHOOL_AND_BOARD_PATTERNS = [
    // écoles / formation
    "\\becole\\b", "\\bschool\\b", "\\biscod\\b", "\\bstudi\\b", "openclassrooms", "\\bcfa\\b", "\\bacademie\\b", "\\bacademy\\b",
    "\\biscom\\b", "\\befap\\b", "\\bifag\\b", "\\biscpa\\b", "\\bpigier\\b", "\\baftec\\b", "\\bieft\\b", "\\becema\\b", "\\beductive\\b",
    "nextadvance", "\\bionis\\b", "\\bsup de (co|vente|pub)\\b", "digital college", "\\bigs\\b", "\\bipac\\b", "\\besgci\\b", "\\besg\\b",
    "\\bmbway\\b", "\\bcesi\\b", "\\bformation\\b", "\\beducation\\b", "\\bapprentissage\\b", "\\bafpa\\b", "\\baftral\\b",
    "\\bicademie\\b", "\\beuridis\\b", "\\binhni\\b", "suptertiaire", "\\bcampus pro\\b", "\\bcmar\\b", "chambre de metiers",
    "\\boktogone\\b", "\\bief2i\\b", "\\balternance\\b",
    // sites d'emploi
    "\\bemploi\\b", "\\bhosco\\b", "\\bjobteaser\\b", "\\bindeed\\b", "\\bhellowork\\b",
];
const SCHOOL_AND_BOARD_PATTERN = new RegExp(SCHOOL_AND_BOARD_PATTERNS.join("|"));
const NON_EMPLOYER_PATTERN = new RegExp(
  [
    ...SCHOOL_AND_BOARD_PATTERNS,
    // noms vides
    "non communique", "confidentiel", "^(ltd|sas|sarl|sa|eurl)$",
  ].join("|"),
);

export function isSchool(company: string): boolean {
  const name = normalizeTitle(company).trim();
  return name.length < 3 || NON_EMPLOYER_PATTERN.test(name);
}

// Pour le deck (/swipe) : écoles, organismes de formation et sites d'emploi
// seulement. Une entreprise au nom masqué (« Entreprise non communiquée »,
// fréquent chez France Travail) est un vrai employeur, elle reste.
export function isSchoolOrJobBoard(company: string): boolean {
  return SCHOOL_AND_BOARD_PATTERN.test(normalizeTitle(company).trim());
}

// Annonces d'écoles dans le deck des abonnés et leurs e-mails d'offres
// (31/10, avis négatifs : « il y a seulement des offres d'école », « pas
// d'offres dans mon secteur »). Le filtre par nom ci-dessus laissait passer
// Walter Learning (1 814 annonces actives, le plus gros « recruteur » de la
// base), YouSchool, TKL Forma, DGBoost… et environ 1 000 annonces d'écoles
// publiées par France Travail sous « Entreprise non communiquée ». Dans
// les secteurs RH, Restauration, Santé et Vente, elles prenaient 70 à 95 %
// des 600 meilleures places du bassin national. On les reconnaît aussi à ce
// que dit l'annonce quand l'annonceur parle comme une école (« nos
// entreprises partenaires », « un de nos partenaires recherche »,
// « intégrer notre formation », « une formation qui recrute »). Les GEIQ et groupements d'employeurs sont de vrais
// employeurs : jamais écartés. Mesuré sur la base le 31/10 : environ 7 000
// annonces actives reconnues, une poignée de faux positifs (une offre
// Cofidis « intégrer notre CFA Cofidis »).
// Ces motifs existent aussi en SQL (colonne offers.is_school_ad,
// SCHOOL_AD_COLUMN_SQL) pour que le tri par qualité ne remplisse plus le
// bassin d'écoles : les deux doivent rester identiques.
const SCHOOL_AD_NAME_TERMS = [
  "ecole", "school", "youschool", "learning", "iscod", "studi", "openclassrooms", "cfa", "academie", "academy",
  "iscom", "efap", "ifag", "iscpa", "pigier", "aftec", "ieft", "ecema", "eductive", "nextadvance", "ionis",
  "sup de (co|vente|pub)", "digital college", "igs", "ipac", "esgci", "esg", "mbway", "cesi", "formations?", "forma",
  "formasup", "beforma", "iforma", "education", "apprentissage", "afpa", "aftral", "icademie", "euridis", "inhni",
  "suptertiaire", "campus pro", "cmar", "chambre de metiers", "oktogone", "ief2i", "alternance", "greta", "ifae",
  "dgboost", "all technics", "isteli", "disciplina", "ducretet", "iriig", "skillie", "afpi", "institut des metiers",
  "emploi", "hosco", "jobteaser", "indeed", "hellowork",
];
const SCHOOL_AD_TEXT =
  "(notre|nos) (ecole|cfa)\\b(?! (de formation )?interne)" +
  "|nos (\\+ ?)?(\\d+ )?(entreprises|magasins|structures|societes|employeurs) partenaires" +
  "|(un|une|l'un|l'une) de nos partenaires" +
  "|formation (en alternance )?qui recrute" +
  "|(integrer|integrez|rejoindre|rejoignez|rejoins) (notre|nos) (formation|cursus|programme|bachelor|ecole)" +
  "|seuls les candidats inscrits" +
  "|inscrits? (dans|a) notre (ecole|formation)";
// Annonceur masqué (« Entreprise non communiquée ») : des indices plus larges suffisent.
const SCHOOL_AD_ANONYMOUS_TEXT =
  "(notre|nos) (centre de formation|organisme de formation|campus|formations?)\\b" +
  "|cette formation est faite pour" +
  "|(integrer|rejoindre|rejoignez) (la|cette) formation" +
  "|100 ?% (financee|prise en charge|gratuite)";
const REAL_EMPLOYER = "\\b(geiq|g\\.e\\.i\\.q|groupement d'?.?employeurs|group employeurs)";

const SCHOOL_AD_NAME_RE = new RegExp(`\\b(${SCHOOL_AD_NAME_TERMS.join("|")})\\b`);
const SCHOOL_AD_TEXT_RE = new RegExp(SCHOOL_AD_TEXT);
const SCHOOL_AD_ANONYMOUS_TEXT_RE = new RegExp(SCHOOL_AD_ANONYMOUS_TEXT);
const REAL_EMPLOYER_RE = new RegExp(REAL_EMPLOYER);

// Même pliage que le SQL : minuscules, sans accents, apostrophe droite.
const foldForSchool = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").replace(/œ/g, "o");

type SchoolAdInput = { company: string; description?: string | null; requirements?: string | null };

export function isSchoolAd(offer: SchoolAdInput): boolean {
  const company = foldForSchool(offer.company ?? "");
  if (REAL_EMPLOYER_RE.test(company)) return false;
  if (SCHOOL_AD_NAME_RE.test(company)) return true;
  const text = foldForSchool(`${offer.description ?? ""} ${offer.requirements ?? ""}`);
  if (SCHOOL_AD_TEXT_RE.test(text)) return true;
  return company.includes("non communiqu") && SCHOOL_AD_ANONYMOUS_TEXT_RE.test(text);
}

// Colonne calculée par Postgres (STORED : recalculée à chaque écriture,
// rien à changer à l'import). \b de JS s'écrit \M après une parenthèse
// (fin de mot) et \m avant (début de mot) en SQL. Une ligne par instruction (voir CHANNEL_VIEWS_SQL).
const sqlFold = (expr: string) => `translate(lower(${expr}), 'éèêëàâäîïôöûüùçœ’', 'eeeeaaaiioouuuco''')`;
const sqlRe = (re: string) => `'${re.replace(/(?<=\))\\b/g, "\\M").replace(/\\b(?=\()/g, "\\m").replace(/'/g, "''")}'`;
const SQL_COMPANY = sqlFold("company");
const SQL_TEXT = sqlFold("coalesce(description, '') || ' ' || coalesce(requirements, '')");
export const SCHOOL_AD_COLUMN_SQL =
  "alter table public.offers add column if not exists is_school_ad boolean generated always as (" +
  `not ${SQL_COMPANY} ~ ${sqlRe(REAL_EMPLOYER)} and (${SQL_COMPANY} ~ ${sqlRe(`\\b(${SCHOOL_AD_NAME_TERMS.join("|")})\\b`)} ` +
  `or ${SQL_TEXT} ~ ${sqlRe(SCHOOL_AD_TEXT)} ` +
  `or (${SQL_COMPANY} ~ 'non communiqu' and ${SQL_TEXT} ~ ${sqlRe(SCHOOL_AD_ANONYMOUS_TEXT)}))) stored;`;
