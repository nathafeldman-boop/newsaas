"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStaticCoverLetter, type CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import { isPremium } from "@/lib/subscription/isPremium";

export type GenerateCoverLetterResult =
  | { status: "success"; letter: string }
  | { status: "premium_required" }
  | { status: "error"; message: string };

// Déclenché à l'ouverture de /candidature/[offerId] (et sur "Régénérer").
// Candidater reste illimité même sans Premium : la candidature (+ le swipe
// qui l'accompagne, pour le quota) est toujours enregistrée -- seule la
// lettre est réservée aux membres Premium.
//
// Génération 100% statique (voir staticGenerator.ts), plus aucun appel
// Mistral : la version IA plantait pour tous les Premium depuis le 4
// septembre (quota Mistral à 0 req/min, hors de notre contrôle), et une
// fonctionnalité Premium phare indisponible pendant des jours a été
// identifiée comme cause directe de mauvais avis et de churn.
export async function generateCoverLetterAction(
  offerId: string,
  extra?: CoverLetterExtra,
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
      .select("title, company, description, location, requirements, contract_type")
      .eq("id", offerId)
      .single(),
    supabase
      .from("profiles")
      .select(
        "full_name, city, skills, sectors, target_jobs, education_level, formation, experience_level, subscription_status",
      )
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
    await supabase
      .from("applications")
      .insert({ user_id: user.id, offer_id: offerId, status: "envoyee" });
  }

  await supabase
    .from("swipes")
    .upsert(
      { user_id: user.id, offer_id: offerId, direction: "like" },
      { onConflict: "user_id,offer_id" },
    );

  if (!isPremium(profile)) {
    return { status: "premium_required" };
  }

  const letter = generateStaticCoverLetter(offer, profile, extra);

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
