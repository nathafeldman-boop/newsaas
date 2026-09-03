import { z } from "zod";
import { getMistralClient, getMistralModel } from "@/lib/mistral/client";
import { SECTORS } from "@/lib/onboarding/options";

// Liste fermée (hors "Autre", inutile comme filtre) : le matching
// (computeMatchScore) compare offer.sector à profile.sectors par égalité
// stricte de chaîne. Si Mistral invente librement son propre libellé
// ("Comptabilité", "Développement web"...), il ne matchera jamais aucun
// secteur choisi à l'onboarding et l'offre perd tout son bonus de
// pertinence — d'où la contrainte à la même liste que l'onboarding/profil.
const SECTOR_ENUM: string[] = SECTORS.filter((s) => s !== "Autre");

export const extractedOfferSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  location: z.string().min(1),
  contract_type: z.enum(["alternance", "stage"]),
  // Volontairement une chaîne libre (pas z.enum) : si Mistral renvoie un
  // libellé hors liste malgré la consigne du prompt, on ne veut pas faire
  // échouer toute l'ingestion pour un simple champ de scoring — on
  // normalise plutôt vers null juste après le parse (voir plus bas).
  sector: z.string().nullable().optional(),
  description: z.string().min(1),
  requirements: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  // Chaîne libre volontairement (pas de validation stricte AAAA-MM-JJ ici) :
  // si Mistral s'écarte un peu du format demandé, on préfère normaliser vers
  // null juste après le parse (voir plus bas) plutôt que faire échouer toute
  // l'ingestion pour ce seul champ.
  start_date: z.string().nullable().optional(),
  remote_policy: z.string().nullable().optional(),
  apply_url: z.string().url().nullable().optional(),
});

export type ExtractedOffer = z.infer<typeof extractedOfferSchema>;

const SYSTEM_PROMPT = `Tu es un extracteur de données pour une plateforme française de recherche
d'alternance et de stage. On te donne le texte brut d'une page d'offre d'emploi
(parfois bruité : menus, cookies, etc. peuvent traîner dans le texte).

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces
champs :
{
  "title": string,
  "company": string,
  "location": string (ville ou "Remote"),
  "contract_type": "alternance" | "stage",
  "sector": une valeur EXACTE parmi [${SECTOR_ENUM.join(", ")}] ou null si aucune ne convient vraiment,
  "description": string (2 à 5 phrases, en français, résumant la mission),
  "requirements": string | null (profil recherché),
  "duration": string | null (ex: "12-24 mois", "6 mois"),
  "salary": string | null (ex: "900-1200€/mois"),
  "start_date": string | null (date de début au format AAAA-MM-JJ ; si seulement un mois
    ou une période est cité (ex: "à partir de janvier 2027" ou "Janvier/Mars 2027"), utilise
    le 1er jour du mois le plus tôt cité (ici "2027-01-01") ; null si aucune date n'est donnée),
  "remote_policy": string | null ("sur site" | "hybride" | "remote"),
  "apply_url": string | null (lien direct de candidature si présent dans le texte)
}

Important : le titre/l'intitulé de poste contient parfois lui-même la durée, la
rémunération ou la date de début (ex: "Stage 6 mois - 1700€/mois - à partir de janvier
2027"). Dans ce cas, recopie quand même ces informations dans les champs dédiés
(duration, salary, start_date) en plus du titre complet -- ne les laisse pas à null sous
prétexte qu'elles apparaissent déjà dans le titre.

Si une info est absente du texte, mets null plutôt que d'inventer. Ne fabrique jamais
d'entreprise ou de lieu qui n'apparaît pas dans le texte fourni.`;

export async function extractOfferFromText(
  rawText: string,
  hints?: { sourceUrl?: string; contractTypeHint?: "alternance" | "stage" },
): Promise<ExtractedOffer> {
  const client = getMistralClient();
  const model = getMistralModel();

  const truncated = rawText.slice(0, 12000);

  const userContent = [
    hints?.sourceUrl ? `URL source : ${hints.sourceUrl}` : null,
    hints?.contractTypeHint
      ? `Indice : il s'agit probablement d'un(e) ${hints.contractTypeHint}.`
      : null,
    "Texte de l'offre :",
    truncated,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await client.chat.complete({
    model,
    temperature: 0.1,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const content = result.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((c) => ("text" in c ? c.text : "")).join("")
    : (content ?? "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Mistral n'a pas renvoyé de JSON exploitable.");
  }

  const offer = extractedOfferSchema.parse(parsed);
  if (offer.sector && !SECTOR_ENUM.includes(offer.sector)) {
    offer.sector = null;
  }
  // offer.start_date part en colonne Postgres `date` (voir ingestOffer.ts) :
  // un format inattendu de la part de Mistral ferait échouer l'insertion de
  // toute l'offre pour un simple champ d'affichage, donc on retombe sur null
  // plutôt que de laisser passer une chaîne non conforme.
  if (offer.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(offer.start_date)) {
    offer.start_date = null;
  }
  return offer;
}
