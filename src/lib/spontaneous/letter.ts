import type { Profile } from "@/types/database";

// Lettre de candidature spontanée (28/10), écrite à la main et remplie avec
// le profil : aucun appel IA (envoyée en nombre par l'offre Auto). Pas
// d'offre derrière : on ne parle jamais d'« annonce », seulement du métier
// visé, de la formation et de l'activité réelle de l'entreprise (code NAF
// donné par La bonne alternance).

type LetterProfile = Pick<Profile, "full_name" | "target_jobs" | "formation" | "education_level" | "skills" | "availability_date" | "city" | "gender">;

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

export function spontaneousLetter(profile: LetterProfile, company: string, activity: string | null): string {
  const job = profile.target_jobs?.find((j) => j.trim())?.trim() ?? null;
  const formation = profile.formation?.trim() || null;
  const skills = (profile.skills ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const available = profile.availability_date && !Number.isNaN(Date.parse(profile.availability_date)) ? DATE.format(new Date(profile.availability_date)) : null;
  const name = profile.full_name?.trim() || "";

  const opening = `Je recherche un contrat en alternance${job ? ` en tant que ${job.toLowerCase()}` : ""}${
    formation ? `, en parallèle de ma formation ${formation}` : profile.education_level ? ` (niveau ${profile.education_level})` : ""
  }, et je me permets de vous adresser ma candidature spontanée.`;
  const why = activity
    ? `Votre activité (${activity.trim().replace(/\.$/, "").toLowerCase()}) correspond exactement au domaine dans lequel je veux apprendre mon métier, et ${company} serait pour moi un excellent lieu pour progresser au contact de professionnels.`
    : `${company} serait pour moi un excellent lieu pour apprendre mon métier au contact de professionnels.`;
  const skillsLine = skills.length > 0 ? `J'ai déjà développé des compétences en ${list(skills)}, que je souhaite mettre au service de votre équipe.` : null;
  // Accords selon le genre déclaré ; sans genre, une tournure qui n'en a pas.
  const motivation =
    profile.gender === "femme"
      ? "Sérieuse, motivée et impliquée, je suis prête à m'investir pleinement dans les missions que vous me confierez."
      : profile.gender === "homme"
        ? "Sérieux, motivé et impliqué, je suis prêt à m'investir pleinement dans les missions que vous me confierez."
        : "J'ai envie de m'investir pleinement dans les missions que vous me confierez.";
  const availability = available ? `Je suis disponible à partir du ${available}.` : "Je suis disponible rapidement.";

  return [
    "Madame, Monsieur,",
    "",
    opening,
    "",
    why,
    ...(skillsLine ? ["", skillsLine] : []),
    "",
    `${motivation} ${availability} Vous trouverez mon CV en pièce jointe, et je me tiens à votre disposition pour un échange.`,
    "",
    "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    ...(name ? ["", name] : []),
  ].join("\n");
}
