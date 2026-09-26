import type { Profile } from "@/types/database";

// Même ensemble de champs onboarding que l'algo de matching des swipes (voir
// computeMatchScore dans src/lib/matching/score.ts) : le modèle doit
// "connaître" le candidat aussi bien que l'algo qui choisit les offres
// qu'on lui montre, pas seulement un sous-ensemble -- demande explicite de
// Nathan avant de commencer l'intégration IA. Utilisé à la fois par la
// lettre de motivation et l'audit CV pour ne pas dupliquer deux ensembles
// de champs qui dérivent. Relocalisé depuis lib/gemini/ (provider-neutre
// depuis le passage à Anthropic, voir generateWithAnthropic.ts).
export type ProfileForAI = Pick<
  Profile,
  | "full_name"
  | "city"
  | "bio"
  | "skills"
  | "sectors"
  | "looking_for"
  | "education_level"
  | "formation"
  | "target_jobs"
  | "experience_level"
  | "mobility"
  | "availability_date"
> | null;

export const PROFILE_FOR_AI_COLUMNS =
  "full_name, city, bio, skills, sectors, looking_for, education_level, formation, target_jobs, experience_level, mobility, availability_date";

export function buildProfileContextLines(profile: ProfileForAI): string[] {
  if (!profile) return [];
  const lines: string[] = [];

  const identity = [profile.full_name, profile.education_level, profile.formation]
    .filter(Boolean)
    .join(" — ");
  if (identity) lines.push(`Profil du candidat : ${identity}.`);

  if (profile.looking_for?.length) {
    lines.push(
      `Recherche : ${profile.looking_for.map((t) => (t === "alternance" ? "une alternance" : "un stage")).join(" et ")}.`,
    );
  }
  if (profile.sectors?.length) lines.push(`Secteur(s) visé(s) : ${profile.sectors.join(", ")}.`);
  if (profile.target_jobs?.length) lines.push(`Métier(s) visé(s) : ${profile.target_jobs.join(", ")}.`);
  if (profile.skills?.length) lines.push(`Compétences : ${profile.skills.join(", ")}.`);
  if (profile.experience_level) lines.push(`Expérience : ${profile.experience_level}.`);
  if (profile.city) lines.push(`Ville : ${profile.city}.`);
  if (profile.mobility) lines.push(`Mobilité : ${profile.mobility}.`);
  if (profile.availability_date) lines.push(`Disponible à partir du : ${profile.availability_date}.`);
  if (profile.bio) lines.push(`À propos du candidat : ${profile.bio}`);

  return lines;
}
