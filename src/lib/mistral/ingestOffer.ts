import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractOfferFromText } from "@/lib/mistral/extractOffer";
import type { ContractType, Offer } from "@/types/database";

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export interface IngestOfferInput {
  sourceUrl?: string;
  rawText?: string;
  contractTypeHint?: ContractType;
}

export async function fetchSourceText(sourceUrl: string): Promise<string> {
  const res = await fetch(sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AltOffersBot/1.0; +https://alt.app)",
    },
  });
  if (!res.ok) {
    throw new Error(`Impossible de récupérer la page (HTTP ${res.status}).`);
  }
  const html = await res.text();
  return htmlToText(html);
}

export async function ingestOffer(
  input: IngestOfferInput,
): Promise<{ offer: Offer; created: boolean }> {
  const { sourceUrl, contractTypeHint } = input;
  let { rawText } = input;

  if (!rawText && sourceUrl) {
    rawText = await fetchSourceText(sourceUrl);
  }

  if (!rawText || rawText.trim().length < 40) {
    throw new Error("Pas assez de texte à analyser (URL ou texte collé).");
  }

  const extracted = await extractOfferFromText(rawText, {
    sourceUrl,
    contractTypeHint,
  });

  const dedupKey = sourceUrl ?? rawText.slice(0, 500);
  const externalId = createHash("sha256").update(dedupKey).digest("hex").slice(0, 40);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .upsert(
      {
        title: extracted.title,
        company: extracted.company,
        location: extracted.location,
        contract_type: extracted.contract_type,
        sector: extracted.sector ?? null,
        description: extracted.description,
        requirements: extracted.requirements ?? null,
        duration: extracted.duration ?? null,
        salary: extracted.salary ?? null,
        remote_policy: extracted.remote_policy ?? null,
        apply_url: extracted.apply_url ?? sourceUrl ?? null,
        source: "mistral_ingest",
        source_url: sourceUrl ?? null,
        external_id: externalId,
        is_active: true,
      },
      { onConflict: "source,external_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Échec de l'enregistrement de l'offre.");
  }

  return { offer: data, created: true };
}
