"use server";

import { assertAdminSession } from "@/lib/admin/accessCode";
import { ingestOffer } from "@/lib/mistral/ingestOffer";
import type { ContractType } from "@/types/database";

export type BulkResult = {
  url: string;
  ok: boolean;
  title?: string;
  error?: string;
};

export type IngestState = {
  status: "idle" | "success" | "error" | "bulk_done";
  message?: string;
  offerTitle?: string;
  results?: BulkResult[];
};

// Une URL par ligne -> traitement en lot, séquentiel (pour ne pas cogner
// l'API Mistral en rafale). "à l'infini" dans la limite du raisonnable :
// autant d'URLs réelles que l'admin veut coller, une par une, sans plafond
// artificiel côté code.
export async function ingestOfferAction(
  _prevState: IngestState,
  formData: FormData,
): Promise<IngestState> {
  try {
    await assertAdminSession();
  } catch {
    return { status: "error", message: "Accès refusé." };
  }

  const sourceUrlRaw = ((formData.get("sourceUrl") as string) || "").trim();
  const rawText = ((formData.get("rawText") as string) || "").trim();
  const contractTypeHint =
    ((formData.get("contractTypeHint") as string) || "") as ContractType | "";

  const urls = sourceUrlRaw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0 && !rawText) {
    return { status: "error", message: "Colle une ou plusieurs URLs, ou un texte d'offre." };
  }

  // Une seule URL et pas de texte : comportement simple, un seul résultat.
  if (urls.length <= 1 && !rawText) {
    try {
      const { offer } = await ingestOffer({
        sourceUrl: urls[0],
        contractTypeHint: contractTypeHint || undefined,
      });
      return { status: "success", offerTitle: offer.title };
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      };
    }
  }

  // Texte brut seul (pas d'URL) : idem, résultat simple.
  if (urls.length === 0 && rawText) {
    try {
      const { offer } = await ingestOffer({
        rawText,
        contractTypeHint: contractTypeHint || undefined,
      });
      return { status: "success", offerTitle: offer.title };
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      };
    }
  }

  // Plusieurs URLs : traitement en lot séquentiel.
  const results: BulkResult[] = [];
  for (const url of urls) {
    try {
      const { offer } = await ingestOffer({
        sourceUrl: url,
        contractTypeHint: contractTypeHint || undefined,
      });
      results.push({ url, ok: true, title: offer.title });
    } catch (err) {
      results.push({
        url,
        ok: false,
        error: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  }

  return { status: "bulk_done", results };
}
