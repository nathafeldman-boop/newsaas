"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStaticCoverLetter, type CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import { generateCoverLetterWithGemini } from "@/lib/coverLetter/generateWithGemini";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { PROFILE_FOR_AI_COLUMNS } from "@/lib/gemini/profileContext";
import { isPremium } from "@/lib/subscription/isPremium";
import { logServerEvent } from "@/lib/analytics/logServerEvent";

export type GenerateCoverLetterResult =
  | { status: "success"; letter: string }
  | { status: "premium_required" }
  | { status: "error"; message: string };

// Déclenché à l'ouverture de /candidature/[offerId] (et sur "Régénérer").
// Candidater reste illimité même sans Premium : la candidature (+ le swipe
// qui l'accompagne, pour le quota) est toujours enregistrée -- seule la
// lettre est réservée aux membres Premium.
//
// Gemini en priorité quand configuré (voir .env.example), avec le profil
// onboarding complet en contexte (mêmes champs que l'algo de matching des
// swipes -- demande explicite de Nathan avant de démarrer cette intégration) ;
// repli automatique et silencieux sur le générateur 100% statique (voir
// staticGenerator.ts) dès que Gemini échoue, dépasse son timeout ou n'est pas
// configuré -- jamais un simple appel IA seul en bout de chaîne : la version
// Mistral plantait pour tous les Premium depuis le 4 septembre (quota à 0
// req/min, hors de notre contrôle), et une fonctionnalité Premium phare
// indisponible pendant des jours a été identifiée comme cause directe de
// mauvais avis et de churn.
export async function generateCoverLetterAction(
  offerId: string,
  extra?: CoverLetterExtra,
  attempt = 0,
): Promise<GenerateCoverLetterResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Non authentifié." };
  }

  const [{ data: offer }, { data: profile }] = await Promise.all([
    supabase
      .from("offers")
      .select("title, company, description, location, requirements, contract_type, sector")
      .eq("id", offerId)
      .single(),
    supabase
      .from("profiles")
      .select(`${PROFILE_FOR_AI_COLUMNS}, subscription_status, cv_text`)
      .eq("id", user.id)
      .single(),
  ]);

  if (!offer) {
    return { status: "error", message: "Offre introuvable." };
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("offer_id", offerId)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase
      .from("applications")
      .insert({ user_id: user.id, offer_id: offerId, status: "envoyee" });
    if (insertError) {
      // supabase-js ne throw jamais sur une erreur Postgres -- sans ce log,
      // l'utilisateur croirait avoir postulé (la page continue normalement)
      // alors qu'aucune candidature n'existe en base.
      console.error("generateCoverLetterAction: applications insert failed", insertError, {
        userId: user.id,
        offerId,
      });
    } else {
      await logServerEvent(supabase, user.id, "offer_applied", { offerId });
    }
  }

  const { error: swipeError } = await supabase
    .from("swipes")
    .upsert(
      { user_id: user.id, offer_id: offerId, direction: "like" },
      { onConflict: "user_id,offer_id" },
    );
  if (swipeError) {
    console.error("generateCoverLetterAction: swipes upsert failed", swipeError, { userId: user.id, offerId });
  }

  if (!isPremium(profile)) {
    return { status: "premium_required" };
  }

  let letter: string | null = null;
  let letterSource: "gemini" | "static" = "static";
  if (isGeminiConfigured()) {
    try {
      letter = await generateCoverLetterWithGemini(offer, profile, profile?.cv_text ?? null, extra);
      letterSource = "gemini";
    } catch (err) {
      console.error("generateCoverLetterAction: Gemini a échoué, repli sur le générateur statique", err);
    }
  }
  if (!letter) {
    letter = generateStaticCoverLetter(offer, profile, extra, attempt);
    letterSource = "static";
  }

  await logServerEvent(supabase, user.id, "cover_letter_generated", { offerId, source: letterSource, attempt });

  // Ne touche jamais au statut ici : une candidature déjà en cours
  // d'entretien ne doit pas retomber à "envoyee" à cause d'une
  // régénération de lettre.
  const { error: updateError } = await supabase
    .from("applications")
    .update({ cover_note: letter })
    .eq("user_id", user.id)
    .eq("offer_id", offerId);

  if (updateError) {
    console.error("generateCoverLetterAction: cover_note update failed", updateError);
    // Best-effort : la lettre reste affichée/copiable même si la sauvegarde
    // en base a échoué -- ne jamais bloquer l'utilisateur pour un problème
    // de persistance, la génération elle-même n'a rien d'aléatoire.
  }

  return { status: "success", letter };
}
