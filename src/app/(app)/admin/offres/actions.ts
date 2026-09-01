"use server";

import { createClient } from "@/lib/supabase/server";
import { ingestOffer } from "@/lib/mistral/ingestOffer";
import type { ContractType } from "@/types/database";

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

export type IngestState = {
  status: "idle" | "success" | "error";
  message?: string;
  offerTitle?: string;
};

export async function ingestOfferAction(
  _prevState: IngestState,
  formData: FormData,
): Promise<IngestState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "Accès refusé." };
  }

  const sourceUrl = ((formData.get("sourceUrl") as string) || "").trim();
  const rawText = ((formData.get("rawText") as string) || "").trim();
  const contractTypeHint =
    ((formData.get("contractTypeHint") as string) || "") as ContractType | "";

  if (!sourceUrl && !rawText) {
    return { status: "error", message: "Colle une URL ou un texte d'offre." };
  }

  try {
    const { offer } = await ingestOffer({
      sourceUrl: sourceUrl || undefined,
      rawText: rawText || undefined,
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
