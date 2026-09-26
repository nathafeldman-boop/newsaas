"use server";

import { createClient } from "@/lib/supabase/server";
import { extractCvText } from "@/lib/cv/extractText";
import { auditCvTextStatic } from "@/lib/cvAudit/staticAudit";
import { auditCvWithAnthropic } from "@/lib/cvAudit/generateWithAnthropic";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { PROFILE_FOR_AI_COLUMNS } from "@/lib/ai/profileContext";
import { isPremium } from "@/lib/subscription/isPremium";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import type { CvAudit } from "@/lib/cvAudit/schema";

export type CvAuditState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "success" } & CvAudit);

// Claude (Anthropic) en priorité quand configuré (voir .env.example), avec le
// profil onboarding complet en contexte (mêmes champs que l'algo de matching
// des swipes -- demande explicite de Nathan avant de démarrer cette
// intégration) ; repli automatique et silencieux sur l'analyse 100%
// heuristique (staticAudit.ts) dès que Claude échoue, dépasse son timeout ou
// n'est pas configuré. Même contrainte de fiabilité que la lettre de
// motivation (voir actions.ts du dossier candidature) -- une fonctionnalité
// Premium ne doit jamais dépendre d'un quota tiers hors de notre contrôle.
// Gemini/Mistral retirés le 2026-09-26 (panne côté fournisseur signalée par
// Nathan) au profit de Claude.
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
    .select(`cv_path, subscription_status, ${PROFILE_FOR_AI_COLUMNS}`)
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

  // Séparé du try/catch plus bas : extractCvText lève déjà un message
  // précis et actionnable pour un format non supporté (ex : un vieux
  // ".doc" -- accepté à l'upload mais jamais analysable, seuls PDF/DOCX le
  // sont) -- avant ce correctif, ce message précis se faisait écraser par
  // le "réessaie dans un instant" générique du catch global ci-dessous, qui
  // boucle indéfiniment sur un format qui ne deviendra jamais analysable en
  // réessayant. Bug réel trouvé à l'audit du 2026-09-25.
  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractCvText(buffer, profile.cv_path);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Impossible de lire le contenu de ton CV.",
    };
  }

  if (text.trim().length < 50) {
    return {
      status: "error",
      message:
        "Le texte extrait de ton CV est trop court pour être analysé (CV scanné en image ?).",
    };
  }

  try {
    if (isAnthropicConfigured()) {
      try {
        const audit = await auditCvWithAnthropic(text, profile);
        await logServerEvent(supabase, user.id, "cv_analyzed", { source: "anthropic", score: audit.score });
        return { status: "success", ...audit };
      } catch (err) {
        console.error("auditCvAction: Claude a échoué, repli sur l'analyse statique", err);
      }
    }

    const audit = auditCvTextStatic(text, {
      sectors: profile.sectors,
      targetJobs: profile.target_jobs,
      educationLevel: profile.education_level,
      experienceLevel: profile.experience_level,
    });
    await logServerEvent(supabase, user.id, "cv_analyzed", { source: "static", score: audit.score });
    return { status: "success", ...audit };
  } catch (err) {
    console.error("auditCvAction", err);
    return {
      status: "error",
      message: "L'analyse de ton CV a échoué, réessaie dans un instant.",
    };
  }
}
