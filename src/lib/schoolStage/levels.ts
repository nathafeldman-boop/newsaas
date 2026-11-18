import type { SchoolStageLevel } from "@/types/database";

// Stages scolaires (18/11, Nathan : « rajoute les stages de 3e, de 2nde, de
// 1re et pour les bacs pro »). Pas d'offres importées : ces stages se
// trouvent surtout en demandant directement aux entreprises. Stageio montre
// les entreprises proches (annuaire public, voir companies.ts) et écrit la
// lettre ; l'élève l'envoie ou la dépose lui-même. Rien ne part par La bonne
// alternance (son habilitation d'envoi ne couvre que l'alternance).
//
// Faits vérifiés le 18/11 sur education.gouv.fr et eduscol :
// - 3e : séquence d'observation obligatoire (5 jours), convention signée par
//   le collège, l'entreprise et les parents, plateforme 1élève1stage.
// - Seconde générale et technologique : deux semaines consécutives, sur les
//   deux dernières semaines de juin (15 au 26 juin en 2026).
// - Bac pro : PFMP réparties sur les trois ans, dates fixées par le lycée.
// - 1re générale : pas de stage obligatoire.

export type SchoolStageInfo = {
  id: SchoolStageLevel;
  /** Libellé court (tuiles, titres). */
  label: string;
  /** Page guide publique. */
  slug: string;
  /** Ce qu'on demande, dans la lettre : « un stage d'observation de 3e ». */
  ask: string;
  /** Classe de l'élève, dans la lettre : « en classe de 3e ». */
  classe: string;
  /** Durée, pour la lettre, si on la connaît. */
  duration: string | null;
};

export const SCHOOL_STAGES: Record<SchoolStageLevel, SchoolStageInfo> = {
  "3e": {
    id: "3e",
    label: "Stage de 3e",
    slug: "stage-de-3e",
    ask: "un stage d'observation de 3e",
    classe: "en classe de 3e",
    duration: "5 jours",
  },
  seconde: {
    id: "seconde",
    label: "Stage de seconde",
    slug: "stage-de-seconde",
    ask: "un stage d'observation de seconde",
    classe: "en classe de seconde",
    duration: "2 semaines, fin juin",
  },
  premiere: {
    id: "premiere",
    label: "Stage de 1re",
    slug: "stage-de-premiere",
    ask: "un stage",
    classe: "en classe de 1re",
    duration: null,
  },
  bac_pro: {
    id: "bac_pro",
    label: "Stage de bac pro (PFMP)",
    slug: "stage-bac-pro",
    ask: "une période de formation en milieu professionnel (PFMP)",
    classe: "en bac professionnel",
    duration: null,
  },
};

export const SCHOOL_STAGE_IDS = Object.keys(SCHOOL_STAGES) as SchoolStageLevel[];

export function isSchoolStageLevel(value: unknown): value is SchoolStageLevel {
  return typeof value === "string" && value in SCHOOL_STAGES;
}

/** Âge minimum sans accord d'un parent (RGPD, choix de la France : 15 ans). */
export const CONSENT_AGE = 15;

/** Âge en années révolues à la date `now` (date de naissance AAAA-MM-JJ). */
export function ageOn(birthDate: string | null | undefined, now: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age--;
  return age;
}

/** Vrai tant qu'un élève de moins de 15 ans n'a pas l'accord d'un parent. */
export function waitsForParent(
  profile: { birth_date: string | null; parent_consent_at?: string | null },
  now: Date = new Date(),
): boolean {
  if (profile.parent_consent_at) return false;
  const age = ageOn(profile.birth_date, now);
  return age === null || age < CONSENT_AGE;
}

/**
 * Lettre de demande de stage, remplie avec le profil. Pas d'appel IA, pas
 * d'invention : seulement le niveau, la ville, le secteur et l'entreprise.
 */
export function schoolStageLetter(input: {
  level: SchoolStageLevel;
  fullName: string | null;
  school?: string | null;
  company: string;
  activity: string | null;
  dates?: string | null;
}): string {
  const info = SCHOOL_STAGES[input.level];
  const name = input.fullName?.trim() || "[Ton prénom et ton nom]";
  const school = input.school?.trim() || "[nom de ton établissement]";
  const dates = input.dates?.trim() || "[dates données par ton établissement]";
  const activity = input.activity ? ` dans le domaine « ${input.activity.toLowerCase()} »` : "";
  return [
    "Madame, Monsieur,",
    `Je m'appelle ${name} et je suis ${info.classe} à ${school}. Je recherche ${info.ask}${info.duration ? ` (${info.duration})` : ""}, du ${dates}.`,
    `Je souhaiterais l'effectuer au sein de ${input.company}, pour découvrir votre activité${activity} et les métiers de votre équipe.`,
    "Je suis curieux(se), ponctuel(le) et motivé(e) à l'idée d'apprendre à vos côtés. Mon établissement vous transmettra la convention de stage à signer.",
    "Je reste disponible pour vous rencontrer ou vous appeler, et vous remercie par avance de l'attention que vous porterez à ma demande.",
    `Bien cordialement,\n${name}`,
  ].join("\n\n");
}
