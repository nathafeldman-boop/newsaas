// Générateur de lettre de motivation (outil gratuit, sans compte ni IA) :
// un modèle solide rempli avec les réponses de l'étudiant. Les champs vides
// restent visibles entre crochets, pour qu'il sache quoi compléter. Utilisé
// côté client (formulaire) et côté serveur (exemples affichés sur la page).

export type LetterContract = "alternance" | "stage";
export type LetterGender = "m" | "f" | "n";

export type QualityKey = "organise" | "relationnel" | "curieux" | "rigoureux" | "autonome" | "motive" | "creatif" | "digital";

export type LetterInput = {
  contract: LetterContract;
  gender: LetterGender;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  position: string;
  // "en terminale STMG", "en 1re année de BTS MCO"
  currentStudies: string;
  // Alternance : la formation visée ("un BTS MCO"). Stage : inutilisé.
  targetTraining: string;
  school: string;
  // Alternance : "2 jours en formation, 3 jours en entreprise".
  rhythm: string;
  // "septembre 2027", "janvier 2027", "le 5 janvier 2027"
  startDate: string;
  // Stage : "6 mois".
  duration: string;
  // Fin de la phrase « Je souhaite rejoindre X parce que… »
  whyCompany: string;
  experience: string;
  qualities: QualityKey[];
  // Alternance : rappeler l'aide de l'État à l'employeur (voir AID_UNTIL).
  mentionAid: boolean;
};

export type Letter = { subject: string; greeting: string; paragraphs: string[]; closing: string; signature: string };
export type LetterEmail = { subject: string; lines: string[] };

// Aide exceptionnelle à l'embauche d'apprentis : contrats conclus du 8 mars
// au 31 décembre 2026 (décret n° 2026-168). Au-delà, la phrase disparaît
// d'elle-même tant qu'un nouveau texte n'a pas été vérifié.
export const AID_UNTIL = "2026-12-31";

export function aidAvailable(now = new Date()): boolean {
  return now.toISOString().slice(0, 10) <= AID_UNTIL;
}

const g = (gender: LetterGender, m: string, f: string, n: string) => (gender === "m" ? m : gender === "f" ? f : n);

export const QUALITIES: Record<QualityKey, { label: string; sentence: (gender: LetterGender) => string }> = {
  organise: {
    label: "Organisé(e)",
    sentence: (s) => `${g(s, "Organisé", "Organisée", "Organisé·e")}, je sais mener plusieurs tâches de front et respecter les délais.`,
  },
  relationnel: {
    label: "À l'aise à l'oral",
    sentence: () => "À l'aise à l'oral, j'aime le contact avec les clients et le travail en équipe.",
  },
  curieux: {
    label: "Curieux(se)",
    sentence: (s) => `${g(s, "Curieux", "Curieuse", "Curieux·se")}, j'apprends vite et je n'hésite pas à poser des questions pour progresser.`,
  },
  rigoureux: {
    label: "Rigoureux(se)",
    sentence: (s) => `${g(s, "Rigoureux", "Rigoureuse", "Rigoureux·se")}, je soigne la qualité de mon travail jusque dans les détails.`,
  },
  autonome: {
    label: "Autonome",
    sentence: (s) => `Autonome, je sais avancer ${g(s, "seul", "seule", "seul·e")} sur une mission tout en tenant mon équipe informée.`,
  },
  motive: {
    label: "Motivé(e)",
    sentence: (s) => `${g(s, "Motivé et persévérant", "Motivée et persévérante", "Motivé·e et persévérant·e")}, je vais au bout de ce que j'entreprends.`,
  },
  creatif: {
    label: "Créatif(ve)",
    sentence: (s) => `${g(s, "Créatif", "Créative", "Créatif·ve")}, j'aime proposer des idées nouvelles et les mettre en forme.`,
  },
  digital: {
    label: "À l'aise avec le numérique",
    sentence: () => "À l'aise avec les outils numériques, je prends rapidement en main de nouveaux logiciels.",
  },
};

export const MAX_QUALITIES = 3;

// "[Nom de l'entreprise]" quand le champ est vide : la lettre reste lisible
// et montre ce qu'il reste à compléter.
const or = (value: string, placeholder: string) => value.trim() || `[${placeholder}]`;

function sentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function clause(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ").replace(/[.!?…]+$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

// « à partir de septembre », « d'octobre », « du 5 janvier ».
function fromDate(date: string, placeholder: string): string {
  const value = date.trim();
  if (!value) return `de [${placeholder}]`;
  if (/^le\s/i.test(value)) return `du ${value.slice(3)}`;
  if (/^[aeiouyéèêàâîôûh]/i.test(value)) return `d'${value}`;
  return `de ${value}`;
}

// « au CFA de… », « à l'IUT de… », « à Neoma » : l'étudiant tape le nom de
// son école tel quel, avec ou sans article.
function atSchool(school: string): string {
  const value = school.trim();
  if (/^(à|au|aux|en)\s/i.test(value)) return value;
  if (/^le\s/i.test(value)) return `au ${value.slice(3)}`;
  if (/^les\s/i.test(value)) return `aux ${value.slice(4)}`;
  if (/^(la\s|l')/i.test(value)) return `à ${value}`;
  if (/^(cfa|lycée|lycee|campus|centre|groupe|pôle|pole|cnam|greta)\b/i.test(value)) return `au ${value}`;
  if (/^(école|ecole|université|universite|institut|iut|iae|irts|ifas|ifsi|insa)\b/i.test(value)) return `à l'${value}`;
  return `à ${value}`;
}

function introParagraph(input: LetterInput): string {
  const position = or(input.position, "intitulé du poste");
  if (input.contract === "stage") {
    const studies = input.currentStudies.trim() ? `Actuellement ${clause(input.currentStudies)}` : `${g(input.gender, "Étudiant", "Étudiante", "Étudiant·e")}`;
    const school = input.school.trim() ? ` ${atSchool(input.school)}` : "";
    return `${studies}${school}, je recherche un stage de ${or(input.duration, "durée")} à partir ${fromDate(input.startDate, "date de début")}, au poste de ${position}.`;
  }
  const studies = input.currentStudies.trim() ? `Actuellement ${clause(input.currentStudies)}, je` : "Je";
  const school = input.school.trim() ? ` ${atSchool(input.school)}` : "";
  const rhythm = input.rhythm.trim() ? `, avec un rythme de ${clause(input.rhythm)}` : "";
  return `${studies} vais préparer ${or(input.targetTraining, "formation visée")}${school} à partir ${fromDate(input.startDate, "date de rentrée")}. Je recherche une entreprise pour suivre cette formation en alternance, au poste de ${position}${rhythm}.`;
}

function companyParagraph(input: LetterInput): string {
  const company = or(input.company, "Nom de l'entreprise");
  const why = input.whyCompany.trim()
    ? clause(input.whyCompany)
    : "[ce qui t'attire chez eux : un produit, un projet, leurs valeurs, un article lu à leur sujet]";
  const position = input.position.trim() || "ce poste";
  return `Je souhaite rejoindre ${company} parce que ${why}. Les missions de ${position} correspondent exactement à ce que je veux apprendre.`;
}

function profileParagraph(input: LetterInput): string {
  const qualities = input.qualities.slice(0, MAX_QUALITIES).map((key) => QUALITIES[key].sentence(input.gender));
  const experience = input.experience.trim()
    ? sentence(input.experience)
    : "[Une expérience à mettre en avant : job d'été, stage, projet d'école, association, sport. Dis ce que tu y as fait et appris.]";
  return [experience, ...qualities].join(" ");
}

function contractParagraph(input: LetterInput): string {
  if (input.contract === "stage") {
    return "Ce stage serait pour moi l'occasion de mettre en pratique ma formation sur des missions concrètes et de découvrir de l'intérieur le fonctionnement de votre équipe.";
  }
  const base =
    "L'alternance est pour moi la meilleure façon d'apprendre un métier : je pourrai appliquer chaque semaine ce que j'apprends en formation, et m'investir dans votre équipe sur toute la durée du contrat.";
  const aid =
    input.mentionAid && aidAvailable()
      ? " Pour votre information, un contrat d'apprentissage conclu d'ici le 31 décembre 2026 ouvre droit à une aide de l'État pour sa première année."
      : "";
  return base + aid;
}

export function buildCoverLetter(input: LetterInput): Letter {
  const position = or(input.position, "intitulé du poste");
  const subject =
    input.contract === "stage"
      ? `Candidature pour un stage de ${or(input.duration, "durée")} – ${position}`
      : `Candidature en alternance – ${position} – à partir ${fromDate(input.startDate, "date de rentrée")}`;
  const contact = [input.phone.trim() ? `au ${input.phone.trim()}` : "", input.email.trim() ? `par mail à ${input.email.trim()}` : ""]
    .filter(Boolean)
    .join(" ou ");
  return {
    subject,
    greeting: "Madame, Monsieur,",
    paragraphs: [
      introParagraph(input),
      companyParagraph(input),
      profileParagraph(input),
      contractParagraph(input),
      `Je serais ${g(input.gender, "ravi", "ravie", "ravi·e")} de vous présenter ma motivation lors d'un entretien. Vous pouvez me joindre ${contact || "[ton téléphone et ton mail]"}.`,
    ],
    closing: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    signature: `${or(input.firstName, "Prénom")} ${or(input.lastName, "Nom")}`,
  };
}

// Version courte pour le corps du mail (la lettre part en pièce jointe).
export function buildCoverEmail(input: LetterInput): LetterEmail {
  const letter = buildCoverLetter(input);
  const company = or(input.company, "Nom de l'entreprise");
  return {
    subject: letter.subject,
    lines: [
      "Bonjour,",
      introParagraph(input),
      `${company} m'attire particulièrement, et je serais ${g(input.gender, "ravi", "ravie", "ravi·e")} d'échanger avec vous lors d'un entretien. Vous trouverez en pièce jointe mon CV et ma lettre de motivation.`,
      "Bien cordialement,",
      [letter.signature, input.phone.trim()].filter(Boolean).join(" – "),
    ],
  };
}

export function letterToText(letter: Letter): string {
  return [`Objet : ${letter.subject}`, letter.greeting, ...letter.paragraphs, letter.closing, letter.signature].join("\n\n");
}

export function emailToText(email: LetterEmail): string {
  return [`Objet : ${email.subject}`, ...email.lines].join("\n\n");
}

export const EMPTY_LETTER_INPUT: LetterInput = {
  contract: "alternance",
  gender: "n",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  company: "",
  position: "",
  currentStudies: "",
  targetTraining: "",
  school: "",
  rhythm: "",
  startDate: "",
  duration: "",
  whyCompany: "",
  experience: "",
  qualities: [],
  mentionAid: true,
};
