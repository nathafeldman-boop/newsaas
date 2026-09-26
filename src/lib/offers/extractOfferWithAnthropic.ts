import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getAnthropicModel, ANTHROPIC_TIMEOUT_MS } from "@/lib/anthropic/client";
import { SECTORS } from "@/lib/onboarding/options";

// Liste fermée (hors "Autre", inutile comme filtre) : le matching
// (computeMatchScore) compare offer.sector à profile.sectors par égalité
// stricte de chaîne. Si le modèle invente librement son propre libellé
// ("Comptabilité", "Développement web"...), il ne matchera jamais aucun
// secteur choisi à l'onboarding et l'offre perd tout son bonus de
// pertinence — d'où la contrainte à la même liste que l'onboarding/profil.
const SECTOR_ENUM: string[] = SECTORS.filter((s) => s !== "Autre");

export const extractedOfferSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  location: z.string().min(1),
  contract_type: z.enum(["alternance", "stage"]),
  // Volontairement une chaîne libre (pas z.enum) : si le modèle renvoie un
  // libellé hors liste malgré la consigne du prompt, on ne veut pas faire
  // échouer toute l'ingestion pour un simple champ de scoring — on
  // normalise plutôt vers null juste après le parse (voir plus bas).
  sector: z.string().nullable(),
  description: z.string().min(1),
  requirements: z.string().nullable(),
  duration: z.string().nullable(),
  salary: z.string().nullable(),
  // Chaîne libre volontairement (pas de validation stricte AAAA-MM-JJ ici) :
  // si le modèle s'écarte un peu du format demandé, on préfère normaliser
  // vers null juste après le parse (voir plus bas) plutôt que faire échouer
  // toute l'ingestion pour ce seul champ.
  start_date: z.string().nullable(),
  remote_policy: z.string().nullable(),
  apply_url: z.string().nullable(),
});

export type ExtractedOffer = z.infer<typeof extractedOfferSchema>;

const SYSTEM_PROMPT = `Tu es un extracteur de données pour une plateforme française de recherche
d'alternance et de stage. On te donne le texte brut d'une page d'offre d'emploi
(parfois bruité : menus, cookies, etc. peuvent traîner dans le texte).

Renvoie ta réponse en respectant le format demandé, avec ces règles :
- location : ville ou "Remote".
- sector : une valeur EXACTE parmi [${SECTOR_ENUM.join(", ")}] ou null si aucune ne convient vraiment.
- description : 2 à 5 phrases, en français, résumant la mission.
- duration : ex "12-24 mois", "6 mois", ou null.
- salary : ex "900-1200€/mois", ou null.
- start_date : date de début au format AAAA-MM-JJ ; si seulement un mois ou une période est
  cité (ex: "à partir de janvier 2027" ou "Janvier/Mars 2027"), utilise le 1er jour du mois le
  plus tôt cité (ici "2027-01-01") ; null si aucune date n'est donnée.
- remote_policy : "sur site" | "hybride" | "remote", ou null.
- apply_url : lien direct de candidature si présent dans le texte, sinon null.

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
  const client = getAnthropicClient();
  const model = getAnthropicModel();

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

  const response = await client.messages.parse(
    {
      model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      temperature: 0.1,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: zodOutputFormat(extractedOfferSchema) },
    },
    { timeout: ANTHROPIC_TIMEOUT_MS },
  );

  if (!response.parsed_output) {
    throw new Error("Claude n'a pas renvoyé de JSON exploitable.");
  }

  const offer = response.parsed_output;
  if (offer.sector && !SECTOR_ENUM.includes(offer.sector)) {
    offer.sector = null;
  }
  // offer.start_date part en colonne Postgres `date` (voir ingestOffer.ts) :
  // un format inattendu de la part du modèle ferait échouer l'insertion de
  // toute l'offre pour un simple champ d'affichage, donc on retombe sur null
  // plutôt que de laisser passer une chaîne non conforme.
  if (offer.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(offer.start_date)) {
    offer.start_date = null;
  }
  if (offer.apply_url) {
    try {
      new URL(offer.apply_url);
    } catch {
      offer.apply_url = null;
    }
  }
  return offer;
}
