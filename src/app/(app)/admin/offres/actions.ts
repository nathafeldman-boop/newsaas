"use server";

import { createClient } from "@/lib/supabase/server";
import { ingestOffer } from "@/lib/mistral/ingestOffer";
import type { ContractType } from "@/types/database";

// Ingestion en lot fait un fetch + un appel Mistral par URL, séquentiellement :
// sans ceci la fonction tourne sur le défaut Vercel (10s), largement dépassé
// dès qu'on colle plus de quelques URLs. 60s = plafond du plan Hobby.
export const maxDuration = 60;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("Accès refusé.");
  }
}

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
    await assertAdmin();
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
