import { getMistralClient, getMistralModel } from "@/lib/mistral/client";
import type { Offer, Profile } from "@/types/database";

const SYSTEM_PROMPT = `Tu es un conseiller carrière qui rédige, pour des étudiants et jeunes
diplômés français, une lettre de motivation courte et percutante pour candidater à une
alternance ou un stage. Réponds UNIQUEMENT avec le texte de la lettre, en français, prêt à
être collé dans un formulaire de candidature ou un email -- pas de formule d'en-tête du type
"Objet :" ni de placeholders entre crochets. 150 à 220 mots, concret (pas de généralités
vides), qui s'appuie sur les informations réelles fournies sur le candidat et l'offre. Termine
par une formule de politesse simple.`;

type OfferInput = Pick<Offer, "title" | "company" | "description" | "location">;
type ProfileInput = Pick<
  Profile,
  | "full_name"
  | "city"
  | "skills"
  | "sectors"
  | "education_level"
  | "formation"
  | "experience_level"
  | "bio"
> | null;

function buildUserPrompt(offer: OfferInput, profile: ProfileInput, cvText: string | null) {
  const lines = [
    `Offre : ${offer.title} chez ${offer.company} (${offer.location}).`,
    `Description de l'offre : ${offer.description.slice(0, 1500)}`,
  ];

  if (profile) {
    const identity = [profile.full_name, profile.education_level, profile.formation]
      .filter(Boolean)
      .join(" — ");
    if (identity) lines.push(`Profil du candidat : ${identity}.`);
    if (profile.skills?.length) lines.push(`Compétences : ${profile.skills.join(", ")}.`);
    if (profile.sectors?.length) lines.push(`Secteurs visés : ${profile.sectors.join(", ")}.`);
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
    "statusCode" in err &&
    (err as { statusCode?: number }).statusCode === 429
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
  const client = getMistralClient();
  const model = getMistralModel();
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(offer, profile, cvText) },
  ];

  // Un 429 "rate limited" en prod est en pratique quasi systématiquement une
  // rafale passagère (le compte Mistral partage son quota par minute avec
  // l'ingestion d'offres et l'audit CV) : un seul essai suffisait à bloquer
  // toute génération de lettre le temps que le quota se libère, alors qu'un
  // court retry suffit souvent à passer.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await client.chat.complete({ model, temperature: 0.6, messages });
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

function finalizeLetter(result: Awaited<ReturnType<ReturnType<typeof getMistralClient>["chat"]["complete"]>>): string {
  const content = result.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((c) => ("text" in c ? c.text : "")).join("")
    : (content ?? "");

  if (!text.trim()) {
    throw new Error("Mistral n'a pas renvoyé de lettre exploitable.");
  }

  return text.trim();
}
