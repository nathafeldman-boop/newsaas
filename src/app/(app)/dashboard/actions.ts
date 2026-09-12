"use server";

import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import {
  generateInterviewQuiz,
  type InterviewLevel,
  type InterviewQuestion,
} from "@/lib/groq/generateInterviewQuiz";

export type GenerateQuizResult =
  | { status: "success"; questions: InterviewQuestion[] }
  | { status: "premium_required" }
  | { status: "error"; message: string };

// Génère tout le quiz d'un coup (questions + bonnes réponses + explications)
// et le renvoie en entier au client, qui joue l'entretien et calcule le
// score localement sans autre aller-retour serveur -- pas de table dédiée
// pour ce V1, un utilisateur curieux pourrait inspecter la réponse réseau et
// voir les bonnes réponses à l'avance, mais c'est un outil d'auto-évaluation,
// pas un examen certifiant : ce compromis simplicité/anti-triche est
// acceptable ici.
export async function generateInterviewQuizAction(
  job: string,
  level: InterviewLevel,
): Promise<GenerateQuizResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Non authentifié." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (!isPremium(profile)) {
    return { status: "premium_required" };
  }

  const trimmedJob = job.trim().slice(0, 120);
  if (!trimmedJob) {
    return { status: "error", message: "Choisis d'abord un métier ou un secteur." };
  }

  try {
    const questions = await generateInterviewQuiz(trimmedJob, level);
    return { status: "success", questions };
  } catch (err) {
    console.error("generateInterviewQuizAction", err);
    return {
      status: "error",
      message: "La génération de l'entretien a échoué, réessaie dans un instant.",
    };
  }
}
