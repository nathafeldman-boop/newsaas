import { getGroqClient, getGroqModel } from "@/lib/groq/client";
import type { Offer, Profile } from "@/types/database";

const SYSTEM_PROMPT = `Tu es un conseiller carrière qui rédige, pour des étudiants et jeunes
diplômés français, une lettre de motivation courte et percutante pour candidater à une
alternance ou un stage. Réponds UNIQUEMENT avec le texte de la lettre, en français, prêt à
être collé dans un formulaire de candidature ou un email -- pas de formule d'en-tête du type
"Objet :" ni de placeholders entre crochets.

Règle la plus importante : choisis 2 à 3 exigences ou mots-clés concrets tirés de la
description/des prérequis de l'offre, et relie CHACUN explicitement à un élément réel et
précis du candidat (une compétence listée, une ligne du CV, sa formation ou son expérience) --
jamais une affirmation générique non justifiée. Bannis les formules creuses type "je suis
très motivé(e) et rigoureux(se)" ou "cette offre correspond parfaitement à mon projet" si rien
de concret ne vient les étayer juste après. La première phrase doit référencer précisément
l'intitulé du poste et l'entreprise, jamais une accroche interchangeable d'une lettre à
l'autre. Mentionne explicitement s'il s'agit d'un stage ou d'une alternance, avec le bon mot.

170 à 240 mots. Termine par une formule de politesse simple. S'il manque des informations
sur le candidat pour étayer un point, n'invente rien : appuie-toi uniquement sur ce qui est
réellement fourni ci-dessous.`;

type OfferInput = Pick<
  Offer,
  "title" | "company" | "description" | "location" | "requirements" | "contract_type"
>;
type ProfileInput = Pick<
  Profile,
  | "full_name"
  | "city"
  | "skills"
  | "sectors"
  | "target_jobs"
  | "education_level"
  | "formation"
  | "experience_level"
  | "bio"
> | null;

function buildUserPrompt(offer: OfferInput, profile: ProfileInput, cvText: string | null) {
  const lines = [
    `Offre : ${offer.title} chez ${offer.company} (${offer.location}).`,
    `Type de contrat : ${offer.contract_type === "alternance" ? "alternance" : "stage"}.`,
    `Description de l'offre : ${offer.description.slice(0, 1500)}`,
  ];

  if (offer.requirements) {
    lines.push(`Prérequis/compétences demandées par l'offre : ${offer.requirements.slice(0, 800)}`);
  }

  if (profile) {
    const identity = [profile.full_name, profile.education_level, profile.formation]
      .filter(Boolean)
      .join(" — ");
    if (identity) lines.push(`Profil du candidat : ${identity}.`);
    if (profile.skills?.length) lines.push(`Compétences : ${profile.skills.join(", ")}.`);
    if (profile.sectors?.length) lines.push(`Secteurs visés : ${profile.sectors.join(", ")}.`);
    if (profile.target_jobs?.length) lines.push(`Métiers visés : ${profile.target_jobs.join(", ")}.`);
    if (profile.experience_level) lines.push(`Expérience : ${profile.experience_level}.`);
    if (profile.bio) lines.push(`À propos du candidat : ${profile.bio}`);
  }

  if (cvText) {
    lines.push(`Extrait du CV du candidat :\n${cvText.slice(0, 4000)}`);
  }

  return lines.join("\n");
}

function isRateLimitError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: number }).status === 429
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateCoverLetter(
  offer: OfferInput,
  profile: ProfileInput,
  cvText: string | null,
): Promise<string> {
  const client = getGroqClient();
  const model = getGroqModel();
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(offer, profile, cvText) },
  ];

  // Retry court sur 429 : le palier gratuit Groq est largement plus large que
  // l'ancien quota Mistral, mais une rafale ponctuelle reste possible.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await client.chat.completions.create({ model, temperature: 0.6, messages });
      return finalizeLetter(result);
    } catch (err) {
      lastErr = err;
      if (isRateLimitError(err) && attempt < 2) {
        await sleep(1500);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function finalizeLetter(result: { choices: { message: { content: string | null } }[] }): string {
  const text = result.choices?.[0]?.message?.content ?? "";

  if (!text.trim()) {
    throw new Error("L'IA n'a pas renvoyé de lettre exploitable.");
  }

  return text.trim();
}
