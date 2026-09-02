"use server";

import { createClient } from "@/lib/supabase/server";
import { extractCvText } from "@/lib/cv/extractText";
import { auditCvText } from "@/lib/mistral/auditCv";
import { isPremium } from "@/lib/subscription/isPremium";
import type { CvAudit } from "@/lib/mistral/auditCv";

export type CvAuditState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "success" } & CvAudit);

export async function auditCvAction(
  _prevState: CvAuditState,
  _formData: FormData,
): Promise<CvAuditState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Non authentifié." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path, subscription_status")
    .eq("id", user.id)
    .single();

  if (!isPremium(profile)) {
    return {
      status: "error",
      message: "L'audit CV est réservé aux membres Premium (7,99€/mois).",
    };
  }

  if (!profile?.cv_path) {
    return {
      status: "error",
      message: "Ajoute d'abord ton CV ci-dessus, puis relance l'analyse.",
    };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("cvs")
    .download(profile.cv_path);

  if (downloadError || !file) {
    return {
      status: "error",
      message: "Impossible de récupérer ton CV : " + (downloadError?.message ?? ""),
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractCvText(buffer, profile.cv_path);

    if (text.trim().length < 50) {
      return {
        status: "error",
        message:
          "Le texte extrait de ton CV est trop court pour être analysé (CV scanné en image ?).",
      };
    }

    const audit = await auditCvText(text);
    return { status: "success", ...audit };
  } catch (err) {
    console.error("auditCvAction", err);
    return {
      status: "error",
      message: "L'analyse de ton CV a échoué, réessaie dans un instant.",
    };
  }
}
