import { getMistralClient } from "@/lib/mistral/client";
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

export async function generateCoverLetter(
  offer: OfferInput,
  profile: ProfileInput,
  cvText: string | null,
): Promise<string> {
  const client = getMistralClient();
  const model = process.env.MISTRAL_MODEL || "mistral-large-latest";

  const result = await client.chat.complete({
    model,
    temperature: 0.6,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(offer, profile, cvText) },
    ],
  });

  const content = result.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((c) => ("text" in c ? c.text : "")).join("")
    : (content ?? "");

  if (!text.trim()) {
    throw new Error("Mistral n'a pas renvoyé de lettre exploitable.");
  }

  return text.trim();
}
