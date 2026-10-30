import type { Offer, Profile } from "@/types/database";
import { classifyMetier } from "@/lib/seo/metiers";
import { letterJobTitle } from "@/lib/coverLetter/jobTitle";
import { METIER_PACKS, type MetierPack } from "@/lib/coverLetter/metierPacks";

// Lettre par métier (30/10, Nathan : « en fonction du métier, du secteur
// […] et surtout des offres qu'il a likées […] et tu lui donnes les
// informations à rajouter »). Le métier vient de l'intitulé de l'offre
// (taxonomie du site) ; deux styles, « classique » et « directe ». Ce qu'on
// ne sait pas (formation, une expérience concrète, rythme ou dates) reste
// entre crochets, avec un exemple : l'écran liste ces passages à compléter.
// Les mots-clés de l'annonce que le métier connaît sont repris tels quels,
// pour les recruteurs et leurs logiciels de tri. Jamais pour un envoi
// automatique (Stageio Auto) : les crochets partiraient chez le recruteur.

export type MetierLetterStyle = "classique" | "directe";

type OfferInput = Pick<Offer, "title" | "company" | "description" | "requirements" | "contract_type">;
type ProfileInput = Pick<Profile, "full_name" | "formation" | "education_level"> | null;
type Extra = { achievement?: string; whyCompany?: string };

// Une lettre par caractère, sans accents : les positions restent celles du texte d'origine.
const fold = (text: string) =>
  [...text]
    .map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0) || c)
    .join("")
    .toLowerCase();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mots-clés du métier présents dans l'annonce, écrits comme dans l'annonce (2 au plus). */
export function offerKeywords(pack: MetierPack, text: string, max = 2): string[] {
  const folded = fold(text);
  const found: string[] = [];
  const seen = new Set<string>();
  // Déjà cité dans les compétences de la lettre : pas deux fois.
  const skills = pack.skills.map(fold);
  for (const kw of pack.keywords.filter((k) => !skills.some((s) => s.includes(k)))) {
    const m = new RegExp(`(^|[^a-z0-9])(${escapeRegex(fold(kw))})(?=[^a-z0-9]|$)`).exec(folded);
    if (!m) continue;
    const start = m.index + m[1].length;
    const original = text.slice(start, start + m[2].length).trim();
    const key = fold(original);
    if (!original || seen.has(key)) continue;
    seen.add(key);
    found.push(displayKeyword(original, fold(kw)));
    if (found.length >= max) break;
  }
  return found;
}

// Outils et marques : avec leur majuscule (« React », « Excel »), même si
// l'annonce les écrit en minuscules. Les sigles (SQL, HACCP) restent tels
// quels ; un mot courant écrit avec une majuscule initiale passe en minuscules.
const PROPER_NAMES = new Set([
  "javascript", "typescript", "react", "node", "java", "python", "php", "symfony", "angular", "git", "excel", "word", "sage", "cegid",
  "shopify", "prestashop", "woocommerce", "instagram", "tiktok", "linkedin", "facebook", "canva", "figma", "photoshop", "illustrator",
  "indesign", "salesforce", "zendesk", "windows", "linux", "autocad", "revit", "sketchup", "archicad", "solidworks", "catia", "matlab",
  "jira", "bloomberg", "amadeus", "tableau", "looker", "premiere pro", "after effects", "davinci", "final cut", "google analytics",
  "office 365", "power bi", "ms project", "meta business", "active directory", "scrum", "agile", "sap", "vba",
]);

function displayKeyword(original: string, folded: string): string {
  if (/[A-Z]/.test(original.slice(1))) return original;
  if (PROPER_NAMES.has(folded)) return original.replace(/(^|\s)(\S)/g, (_, sp: string, c: string) => sp + c.toUpperCase());
  return original.toLowerCase();
}

const VOWEL = /^[aeiouyhâàéèêëîïôûùœ]/i;
const de = (word: string) => (VOWEL.test(word) ? `d'${word}` : `de ${word}`);

function posteLabel(title: string, contract: string): string {
  const t = letterJobTitle(title, contract);
  // « Vendeur » → « vendeur », mais « RH », « BTS MCO » restent en majuscules.
  return /^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}

function companyName(company: string): string {
  const c = company.trim();
  return !c || /confidenti|non communiqu|anonyme/i.test(c) ? "votre entreprise" : c;
}

function sentence(text: string): string {
  const t = text.trim();
  if (!t) return t;
  const first = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(first) ? first : `${first}.`;
}

// Après deux-points : minuscule (sauf sigle), point final.
function afterColon(text: string): string {
  const t = sentence(text);
  return /^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}

function list3([a, b, c]: [string, string, string]): string {
  return `${a}, ${b} et ${c}`;
}

/** Métier de l'offre d'après son intitulé, s'il a une fiche. */
export function metierPackFor(title: string): { slug: string; pack: MetierPack } | null {
  const metier = classifyMetier(title);
  const pack = metier ? METIER_PACKS[metier.slug] : undefined;
  return metier && pack ? { slug: metier.slug, pack } : null;
}

export function generateMetierLetter(
  offer: OfferInput,
  profile: ProfileInput,
  style: MetierLetterStyle,
  extra?: Extra,
): string | null {
  const found = metierPackFor(offer.title);
  return found ? buildMetierLetter(found.pack, offer, profile, style, extra) : null;
}

/** Lettre d'un métier donné (les 60 × 2 modèles, testés un par un). */
export function buildMetierLetter(pack: MetierPack, offer: OfferInput, profile: ProfileInput, style: MetierLetterStyle, extra?: Extra): string {
  const alternance = offer.contract_type === "alternance";
  const contrat = alternance ? "en alternance" : "en stage";
  const poste = posteLabel(offer.title, offer.contract_type);
  const entreprise = companyName(offer.company);
  const formation = profile?.formation?.trim() || null;
  const formationPhrase = formation ? `ma formation (${formation})` : "ma formation en [ta formation, par ex. BTS, BUT ou bachelor]";
  const keywords = offerKeywords(pack, `${offer.title} ${offer.description ?? ""} ${offer.requirements ?? ""}`);
  const kwClause =
    keywords.length === 0 ? "" : `, notamment ${keywords.join(" et ")}, que vous citez dans votre annonce`;
  const achievement = extra?.achievement?.trim();
  const experience = achievement
    ? sentence(`Par exemple : ${achievement.replace(/[.!]+$/, "")}`)
    : "[Ajoute une expérience concrète : un job, un stage, un projet ou du bénévolat, et ce que tu y as appris.]";
  const whyCompany = extra?.whyCompany?.trim();
  const rythme = alternance
    ? "Mon rythme d'alternance : [ton rythme, par ex. 2 jours en formation et 3 jours en entreprise], à partir de [date de début]."
    : "Je suis disponible pour un stage de [durée du stage] à partir du [date de début].";
  const name = profile?.full_name?.trim() || "[Prénom Nom]";

  const paragraphs: string[] =
    style === "classique"
      ? [
          "Madame, Monsieur,",
          `Dans le cadre de ${formationPhrase}, je vous adresse ma candidature pour le poste ${de(poste)} ${contrat} chez ${entreprise}.`,
          `${pack.motive} ${alternance ? "En alternance" : "Pendant ce stage"}, je veux apprendre à ${pack.missions}.`,
          `Je souhaite développer chez vous mes compétences en ${list3(pack.skills)}${kwClause}. ${experience}`,
          rythme,
          ...(whyCompany ? [`Ce qui m'attire chez ${entreprise} : ${afterColon(whyCompany)}`] : []),
          "Je me tiens à votre disposition pour un entretien afin de vous présenter ma motivation plus en détail. Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
          name,
        ]
      : [
          "Madame, Monsieur,",
          `Votre offre ${de(poste)} ${contrat} chez ${entreprise} correspond exactement à ce que je recherche. ${sentence(`${formationPhrase} me prépare à ce poste, et je veux maintenant apprendre le métier sur le terrain`)}`,
          `Pourquoi ce métier ? ${pack.motive}`,
          `Ce que je veux apprendre chez vous : ${pack.missions}.`,
          `Les compétences que je veux mettre en œuvre : ${list3(pack.skills)}${kwClause}. ${experience}`,
          rythme,
          ...(whyCompany ? [`Pourquoi ${entreprise} ? ${sentence(whyCompany)}`] : []),
          "Disponible pour un entretien quand vous le souhaitez, en présentiel ou en visio, je vous remercie pour le temps que vous accorderez à ma candidature.",
          `Bien cordialement,\n${name}`,
        ];
  return paragraphs.join("\n\n");
}
