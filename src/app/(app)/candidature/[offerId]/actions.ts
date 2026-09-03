"use server";

import { createClient } from "@/lib/supabase/server";
import { extractCvText } from "@/lib/cv/extractText";
import { generateCoverLetter } from "@/lib/mistral/generateCoverLetter";
import { isPremium } from "@/lib/subscription/isPremium";

export type GenerateCoverLetterResult =
  | { status: "success"; letter: string }
  | { status: "premium_required" }
  | { status: "error"; message: string };

// Déclenché à l'ouverture de /candidature/[offerId] (et sur "Régénérer").
// Candidater reste illimité même sans Premium : la candidature (+ le swipe
// qui l'accompagne, pour le quota) est toujours enregistrée -- seule la
// lettre générée par IA est réservée aux membres Premium.
export async function generateCoverLetterAction(offerId: string): Promise<GenerateCoverLetterResult> {
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
      .select("title, company, description, location")
      .eq("id", offerId)
      .single(),
    supabase
      .from("profiles")
      .select(
        "full_name, city, skills, sectors, education_level, formation, experience_level, bio, cv_path, subscription_status",
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

  let cvText: string | null = null;
  if (profile?.cv_path) {
    try {
      const { data: file } = await supabase.storage.from("cvs").download(profile.cv_path);
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        cvText = await extractCvText(buffer, profile.cv_path);
      }
    } catch {
      cvText = null; // best-effort : la lettre reste utile même sans CV exploitable
    }
  }

  try {
    const letter = await generateCoverLetter(offer, profile, cvText);

    // Ne touche jamais au statut ici : une candidature déjà en cours
    // d'entretien ne doit pas retomber à "envoyee" à cause d'une
    // régénération de lettre.
    await supabase
      .from("applications")
      .update({ cover_note: letter })
      .eq("user_id", user.id)
      .eq("offer_id", offerId);

    return { status: "success", letter };
  } catch (err) {
    console.error("generateCoverLetterAction", err);
    return {
      status: "error",
      message: "La génération de ta lettre a échoué, réessaie dans un instant.",
    };
  }
}
