import type { Offer, Profile } from "@/types/database";
import { isDepartmentLocation } from "@/lib/onboarding/options";
import { METIERS, SPECIALITES, classifyFormations, normalizeTitle, type Metier } from "@/lib/seo/metiers";
import { departementFromLocation, getDepartement, regionOfDepartement } from "@/lib/seo/departements";

const EDUCATION_RANK: Record<string, number> = {
  Bac: 1,
  "Bac+2": 2,
  "Bac+3": 3,
  "Bac+4": 4,
  "Bac+5": 5,
  "Bac+6 et plus": 6,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// \b ne marche pas bien avec les accents français (é, è...) car ce ne sont
// pas des "word characters" par défaut en JS. On borne plutôt avec des
// séparateurs explicites (début/fin de chaîne ou non-lettre) pour éviter les
// faux positifs du type "R" qui matcherait dans "Marketing".
function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`,
    "iu",
  );
  return pattern.test(haystack);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / msPerDay;
}

// offer.location est une chaîne libre ("Villeurbanne", "Lyon 3e", "Bron"...) :
// une comparaison stricte par sous-chaîne sur le nom de ville du profil
// traitait une offre dans la banlieue immédiate d'une métropole comme aussi
// hors-sujet qu'une offre à l'autre bout du pays (pénalité -20 dans
// computeMatchScore) -- alors que "Lyon" et "Villeurbanne", c'est le même
// bassin d'emploi. Pas de données lat/long en base, donc pas de vraie
// distance géographique possible : on retombe sur une liste des villes de
// l'agglomération pour chacune des 13 métropoles proposées à l'onboarding
// (TOP_CITIES).
const METRO_CLUSTERS: string[][] = [
  ["Paris", "Boulogne-Billancourt", "Neuilly-sur-Seine", "Levallois-Perret", "Saint-Denis", "Montreuil", "Issy-les-Moulineaux", "Vincennes", "Nanterre", "Créteil", "Aubervilliers", "Ivry-sur-Seine", "Clichy", "Courbevoie", "La Défense"],
  ["Lyon", "Villeurbanne", "Vénissieux", "Bron", "Caluire-et-Cuire", "Vaulx-en-Velin", "Saint-Priest", "Écully", "Oullins", "Rillieux-la-Pape", "Meyzieu", "Décines-Charpieu"],
  ["Marseille", "Aix-en-Provence", "Aubagne", "Marignane", "Vitrolles", "La Ciotat", "Salon-de-Provence"],
  ["Toulouse", "Blagnac", "Colomiers", "Tournefeuille", "Balma", "Muret", "L'Union"],
  ["Bordeaux", "Mérignac", "Pessac", "Talence", "Bègles", "Villenave-d'Ornon", "Le Bouscat"],
  ["Lille", "Roubaix", "Tourcoing", "Villeneuve-d'Ascq", "Marcq-en-Barœul", "Wattrelos", "Lambersart"],
  ["Nantes", "Saint-Herblain", "Rezé", "Orvault", "Vertou", "Carquefou", "Bouguenais"],
  ["Strasbourg", "Schiltigheim", "Illkirch-Graffenstaden", "Lingolsheim", "Ostwald"],
  ["Nice", "Cagnes-sur-Mer", "Antibes", "Cannes", "Saint-Laurent-du-Var", "Vence"],
  ["Rennes", "Cesson-Sévigné", "Saint-Grégoire", "Bruz", "Chantepie"],
  ["Montpellier", "Castelnau-le-Lez", "Lattes", "Juvignac", "Pérols"],
  ["Grenoble", "Saint-Martin-d'Hères", "Échirolles", "Fontaine", "Meylan", "Eybens"],
  ["Perpignan", "Cabestany", "Saint-Estève", "Le Soler", "Canet-en-Roussillon", "Bompas", "Toulouges"],
];

function findMetroCluster(cityLower: string): string[] | null {
  return (
    METRO_CLUSTERS.find((cities) =>
      cities.some((c) => c.toLowerCase() === cityLower),
    ) ?? null
  );
}

/**
 * Vrai si l'offre est située dans la même agglomération que la ville du
 * profil, sans être une correspondance exacte de chaîne (déjà testée avant
 * l'appel). Utilisé pour un bonus de score intermédiaire et pour affiner le
 * bandeau "X offres vers [ville]" côté /swipe.
 */
export function isNearbyCity(profileCityLower: string, offerLocationLower: string): boolean {
  const cluster = findMetroCluster(profileCityLower);
  if (!cluster) return false;
  return cluster.some((c) => offerLocationLower.includes(c.toLowerCase()));
}

/**
 * Lieux qui valent « dans ta ville » pour computeMatchScore (+14 / +10) :
 * la ville du profil et, pour une métropole, son agglomération. Vide pour
 * un département choisi à l'onboarding (pas de correspondance par lieu dans
 * le score) ou sans ville. Sert à aller chercher ces offres-là en plus du
 * bassin national de /swipe.
 */
export function localCitiesFor(city: string | null | undefined): string[] {
  const trimmed = city?.trim() ?? "";
  if (!trimmed || isDepartmentLocation(trimmed)) return [];
  return findMetroCluster(trimmed.toLowerCase()) ?? [trimmed];
}

// Métiers de la liste du site (lib/seo/metiers) qui correspondent aux métiers
// visés à l'onboarding, choisis dans la liste ou tapés librement :
// « Développeur web » -> développeur, « Assistant comptable » -> comptabilité.
// « ingénieur » seul est trop large (mécanique, BTP...) : écarté quand un
// métier plus précis a été trouvé (« Ingénieur DevOps » -> développeur).
const targetMetiersCache = new Map<string, Metier[]>();

export function targetMetiersOf(targetJobs: string[]): Metier[] {
  const key = targetJobs.join("|");
  const cached = targetMetiersCache.get(key);
  if (cached) return cached;
  const found = new Map<string, Metier>();
  for (const job of targetJobs) {
    const normalized = normalizeTitle(job);
    const matches = [...METIERS, ...SPECIALITES].filter((m) => m.pattern.test(normalized));
    const precise = matches.length > 1 ? matches.filter((m) => m.slug !== "ingenieur") : matches;
    for (const m of precise) found.set(m.slug, m);
  }
  const result = [...found.values()];
  if (targetMetiersCache.size > 500) targetMetiersCache.clear();
  targetMetiersCache.set(key, result);
  return result;
}

export function matchesTargetJob(profile: Pick<Profile, "target_jobs">, offer: Pick<Offer, "title">): boolean {
  if (profile.target_jobs.some((job) => containsWholeWord(offer.title, job))) return true;
  const metiers = targetMetiersOf(profile.target_jobs);
  if (metiers.length === 0) return false;
  const title = normalizeTitle(offer.title);
  return metiers.some((m) => m.pattern.test(title));
}

// Diplôme cité dans l'intitulé (« Apprenti boulanger CAP », « Alternance
// BTS MCO », « Stage Master 2 ») comparé au niveau du profil. Une offre de
// CAP ou de bac pro n'a aucun sens pour un étudiant en bac+3 et plus, une
// offre réservée aux masters pas davantage pour un bac ou bac+2.
const LOW_LEVEL_FORMATIONS = new Set(["cap", "cap-aepe", "bp", "cqp", "advf", "deaes", "bac-pro", "bac-pro-mspc", "titre-pro"]);
const MASTER_FORMATIONS = new Set(["master"]);

export function educationGapPenalty(
  profile: Pick<Profile, "education_level">,
  offer: Pick<Offer, "title"> & { description?: string | null },
): number {
  const rank = profile.education_level ? EDUCATION_RANK[profile.education_level] : undefined;
  if (!rank) return 0;
  // Diplôme de l'intitulé, sinon du début de la description (« Vendeur(se) »
  // dont l'annonce dit « en préparation d'un CAP Équipier polyvalent ») :
  // 25/10, offres jugées « nulles » par des étudiants bac+3.
  let formations = classifyFormations(offer.title).map((f) => f.slug);
  if (formations.length === 0 && offer.description) formations = classifyFormations(offer.description.slice(0, 500)).map((f) => f.slug);
  if (formations.length === 0) return 0;
  const onlyLowLevel = formations.every((slug) => LOW_LEVEL_FORMATIONS.has(slug));
  if (onlyLowLevel && rank >= 3) return -30;
  if (formations.some((slug) => MASTER_FORMATIONS.has(slug)) && rank <= 2) return -15;
  return 0;
}

/**
 * Département du profil : celui choisi à l'onboarding (« Rhône (69) ») ou
 * celui de sa ville (« Lyon » -> 69, « Angers » -> 49). null si inconnu.
 */
export function profileDepartement(city: string | null | undefined): string | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;
  if (isDepartmentLocation(trimmed)) return trimmed.match(/\(([0-9]{2,3}|2[AB])\)\s*$/i)?.[1]?.toUpperCase() ?? null;
  return departementFromLocation(trimmed);
}

export type GeoMatch = { points: number; reason: string | null };

// Proximité de l'offre (25/10, « des offres à l'autre bout de la France ») :
// ville ou agglomération, puis même département, puis même région pour qui
// a dit « mobile dans la région ». Avant : un département choisi à
// l'onboarding valait +4 pour TOUTE la France, et une ville hors des 13
// métropoles n'avait aucune commune voisine (Cholet à -30 pour Angers).
export function geoMatch(profile: Pick<Profile, "city" | "mobility">, offer: Pick<Offer, "location" | "remote_policy">): GeoMatch {
  const city = profile.city?.trim() ?? "";
  const cityLower = city.toLowerCase();
  const offerLocationLower = offer.location.toLowerCase();
  const isDepartmentSelection = !!city && isDepartmentLocation(city);
  if (!isDepartmentSelection && cityLower && offerLocationLower.includes(cityLower)) return { points: 14, reason: `À ${city}, comme toi` };
  if (!isDepartmentSelection && cityLower && isNearbyCity(cityLower, offerLocationLower)) return { points: 10, reason: `Près de ${city}` };

  const profileDep = profileDepartement(city);
  const offerDep = departementFromLocation(offer.location);
  if (profileDep && offerDep === profileDep) {
    const name = getDepartement(profileDep)?.name ?? profileDep;
    return isDepartmentSelection ? { points: 14, reason: `Dans ${name === "Paris" ? "Paris" : `ton département (${name})`}` } : { points: 8, reason: `Dans ton département (${name})` };
  }
  const remote = offer.remote_policy === "remote";
  if (profile.mobility === "Mobile en France" || profile.mobility === "Full remote" || remote) {
    return { points: 8, reason: remote ? "Télétravail possible" : null };
  }
  if (profile.mobility === "Mobile dans la région") {
    const profileRegion = profileDep ? regionOfDepartement(profileDep)?.name : undefined;
    const offerRegion = offerDep ? regionOfDepartement(offerDep)?.name : undefined;
    if (!profileRegion || !offerRegion) return { points: 4, reason: null };
    return profileRegion === offerRegion ? { points: 6, reason: `Dans ta région (${profileRegion})` } : { points: -15, reason: null };
  }
  // Ville ou département renseigné, offre ailleurs, aucune mobilité élargie
  // (vide ou « Sur place uniquement ») : -30 (29/09) -- souvent un métier de
  // terrain impossible à distance ; l'offre ne reste visible que si rien de
  // mieux n'existe (filet de sécurité de /swipe).
  return cityLower ? { points: -30, reason: null } : { points: 0, reason: null };
}

/** Âge de l'offre : une offre de plus d'un mois est souvent déjà pourvue. */
export function freshnessPoints(publishedAt: string, now: number): number {
  const days = (now - Date.parse(publishedAt)) / 86_400_000;
  if (!Number.isFinite(days)) return 0;
  if (days > 60) return -10;
  if (days > 30) return -5;
  if (days <= 3) return 3;
  return 0;
}

// Score heuristique (pas de ML) : part d'une base de 40 et ajoute des points
// selon le recoupement secteur / métier / localisation / compétences / niveau
// d'études / disponibilité. Plafonné à 99 pour ne jamais promettre un match
// "parfait", et jamais en dessous de 30 pour rester crédible sur une échelle
// de %.
export function computeMatchScore(profile: Profile, offer: Offer, now: number = Date.now()): number {
  let score = 40;

  // Type de contrat recherché (stage/alternance/les deux à l'onboarding) :
  // un signal direct et sans ambiguïté. Un seul type coché (« alternance ») :
  // l'autre passe loin derrière (25/10 : des stages dans le deck de gens qui
  // cherchent une alternance depuis des mois).
  if (profile.looking_for.length > 0) {
    if (profile.looking_for.includes(offer.contract_type)) score += 8;
    else if (profile.looking_for.length === 1) score -= 25;
  }

  const jobMatch = profile.target_jobs.length > 0 && matchesTargetJob(profile, offer);

  // Secteur (le plus fort signal : c'est le domaine explicitement choisi).
  // Une offre du métier visé classée dans un secteur voisin (secteur deviné
  // à l'import) compte presque autant : le métier dit déjà le domaine.
  if (offer.sector && profile.sectors.includes(offer.sector)) {
    score += 18;
  } else if (jobMatch && profile.sectors.length > 0) {
    score += 12;
  }

  // Métier recherché : mot entier dans le titre, ou même métier d'après la
  // liste des métiers du site (« Commercial » reconnaît aussi « Business
  // developer » et « Chargé d'affaires »). Poids relevé (10 -> 14) : c'est le
  // signal le plus direct qu'on ait de "c'est exactement le poste que je
  // veux". Sans aucun rapport avec les métiers visés : -12 (14/10, avis « pas
  // assez d'offres pertinentes ») -- l'offre reste dans le deck si rien de
  // mieux n'existe, mais passe derrière celles du bon métier.
  if (profile.target_jobs.length > 0) {
    score += jobMatch ? 14 : -12;
  }

  score += educationGapPenalty(profile, offer);
  score += freshnessPoints(offer.published_at, now);

  // Localisation / mobilité : voir geoMatch.
  score += geoMatch(profile, offer).points;

  // Compétences : proportion de compétences du profil retrouvées (mot entier)
  // dans la description/les prérequis de l'offre.
  if (profile.skills.length > 0) {
    const offerText = `${offer.description} ${offer.requirements ?? ""}`;
    const matched = profile.skills.filter((skill) =>
      containsWholeWord(offerText, skill),
    );
    score += Math.round((matched.length / profile.skills.length) * 16);
  }

  // Niveau d'études : correspondance exacte pleine, surqualifié partielle,
  // sous-qualifié aucun bonus (l'offre demande probablement plus que ce que
  // le profil a acquis).
  if (profile.education_level && offer.education_level) {
    const profileRank = EDUCATION_RANK[profile.education_level];
    const offerRank = EDUCATION_RANK[offer.education_level];
    if (profileRank && offerRank) {
      if (profileRank === offerRank) score += 10;
      else if (profileRank > offerRank) score += 5;
    }
  }

  // Disponibilité : bonus si le profil est dispo avant/autour du début de
  // l'offre, dégressif au-delà d'un mois d'écart.
  if (profile.availability_date && offer.start_date) {
    const diff = daysBetween(profile.availability_date, offer.start_date);
    if (profile.availability_date <= offer.start_date || diff <= 15) {
      score += 6;
    } else if (diff <= 45) {
      score += 3;
    }
  }

  return Math.max(30, Math.min(99, Math.round(score)));
}

// Petites raisons lisibles pour la section "Pourquoi toi" de la carte —
// mêmes critères que computeMatchScore, mais formulés en phrases plutôt
// qu'en points. Plafonné à 3 : au-delà ça devient une liste illisible.
export function computeMatchReasons(profile: Profile, offer: Offer): string[] {
  const reasons: string[] = [];

  if (offer.sector && profile.sectors.includes(offer.sector)) {
    reasons.push(`Secteur ${offer.sector} recherché`);
  }

  const matchedJob =
    profile.target_jobs.find((job) => containsWholeWord(offer.title, job)) ??
    profile.target_jobs.find((job) => targetMetiersOf([job]).some((m) => m.pattern.test(normalizeTitle(offer.title))));
  if (matchedJob) {
    reasons.push(`Correspond à "${matchedJob}"`);
  }

  const geo = geoMatch(profile, offer);
  if (geo.reason) reasons.push(geo.reason);

  if (profile.skills.length > 0) {
    const offerText = `${offer.description} ${offer.requirements ?? ""}`;
    const matchedSkills = profile.skills.filter((skill) => containsWholeWord(offerText, skill));
    if (matchedSkills.length > 0) {
      reasons.push(
        matchedSkills.length === 1
          ? `Compétence en commun : ${matchedSkills[0]}`
          : `${matchedSkills.length} compétences en commun`,
      );
    }
  }

  if (profile.education_level && offer.education_level === profile.education_level) {
    reasons.push(`Niveau ${offer.education_level} demandé`);
  }

  if (profile.looking_for.includes(offer.contract_type)) {
    reasons.push(offer.contract_type === "alternance" ? "C'est une alternance" : "C'est un stage");
  }

  return reasons.slice(0, 3);
}

const CV_STOPWORDS = new Set([
  "dans", "avec", "pour", "sans", "sous", "vers", "chez", "entre", "depuis", "pendant",
  "cette", "celui", "celle", "leurs", "notre", "votre", "nos", "vos", "les", "des",
  "aux", "que", "qui", "quoi", "dont", "mais", "donc", "alors", "ainsi", "plus", "moins",
  "tres", "bien", "tout", "tous", "toute", "toutes", "autre", "autres", "meme", "aussi",
  "avoir", "etre", "faire", "fait", "faits", "annee", "annees", "mois", "jour", "jours",
  "france", "francais", "francaise", "poste", "stage", "alternance", "cdi", "cdd", "diplome",
  "niveau", "formation", "ecole", "universite", "master", "licence", "bachelor", "etudiant",
  "etudiante", "recherche", "developpement", "projet", "projets", "equipe", "gestion",
  "email", "telephone", "adresse", "curriculum", "vitae", "nom", "prenom",
]);

function normalizeCvToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Signature de mots-clés extraits du texte brut du CV -- va bien au-delà des
// champs figés de l'onboarding (skills choisies dans une liste fermée) en
// puisant dans le contenu réel (missions, outils, projets décrits). Les mots
// les plus FRÉQUENTS dans le CV sont retenus en priorité (plus susceptibles
// d'être des compétences/outils réellement centraux qu'une mention isolée),
// et la liste est plafonnée pour rester rapide à comparer contre des
// centaines d'offres candidates.
const MAX_CV_KEYWORDS = 50;

function extractCvKeywords(cvText: string): string[] {
  const counts = new Map<string, number>();
  for (const raw of cvText.split(/[^\p{L}\p{N}]+/u)) {
    const token = normalizeCvToken(raw);
    if (token.length < 5 || CV_STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CV_KEYWORDS)
    .map(([token]) => token);
}

// Bonus premium : va chercher dans le texte réel du CV (pas seulement les
// champs onboarding) des recoupements avec l'offre -- réservé aux
// utilisateurs Premium ayant un CV exploitable (voir swipe/page.tsx),
// puisque ça suppose d'avoir déjà extrait et mis en cache ce texte
// (profiles.cv_text, posé à l'upload). Plafonné comme les autres bonus,
// jamais assez fort à lui seul pour dominer le score de base.
export function computeCvMatchBonus(
  cvText: string | null,
  offer: Pick<Offer, "title" | "description" | "requirements">,
  cap = 16,
): number {
  if (!cvText) return 0;
  const keywords = extractCvKeywords(cvText);
  if (keywords.length === 0) return 0;

  const offerText = `${offer.title} ${offer.description} ${offer.requirements ?? ""}`;
  const matched = keywords.filter((kw) => containsWholeWord(offerText, kw));
  if (matched.length === 0) return 0;

  return Math.min(cap, matched.length * 1.5);
}
