"use server";

import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { generateOfferFitWithGemini } from "@/lib/cvAudit/generateOfferFitWithGemini";
import { computeStaticOfferFit } from "@/lib/cvAudit/staticOfferFit";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import type { OfferFit } from "@/lib/cvAudit/offerFitSchema";

export type OfferFitState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "success" } & OfferFit);

// "Analyser mon CV pour cette offre" (section 14) : compare explicitement le
// CV au texte de CETTE offre plutôt que d'auditer le CV seul -- même
// doctrine hybride Gemini + repli statique que le reste des fonctionnalités
// IA du produit (voir cv-audit-actions.ts).
export async function analyzeOfferFitAction(offerId: string): Promise<OfferFitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Non authentifié." };

  const [{ data: profile }, { data: offer }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, skills, cv_text")
      .eq("id", user.id)
      .single(),
    supabase.from("offers").select("title, company, description, requirements").eq("id", offerId).single(),
  ]);

  if (!isPremium(profile)) {
    return { status: "error", message: "Réservé aux membres Premium (7,99€/mois)." };
  }
  if (!offer) return { status: "error", message: "Offre introuvable." };
  if (!profile?.cv_text) {
    return { status: "error", message: "Ajoute d'abord ton CV dans ton profil, puis relance l'analyse." };
  }

  let result: OfferFit;
  let source: "gemini" | "static" = "static";
  if (isGeminiConfigured()) {
    try {
      result = await generateOfferFitWithGemini(profile.cv_text, offer);
      source = "gemini";
    } catch (err) {
      console.error("analyzeOfferFitAction: Gemini a échoué, repli statique", err);
      result = computeStaticOfferFit(profile.skills, offer);
    }
  } else {
    result = computeStaticOfferFit(profile.skills, offer);
  }

  await logServerEvent(supabase, user.id, "cv_offer_fit_analyzed", { offerId, source, score: result.score });

  return { status: "success", ...result };
}
