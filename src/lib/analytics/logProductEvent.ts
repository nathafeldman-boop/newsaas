import { createClient } from "@/lib/supabase/client";

// Événements d'usage du produit (25/10, cockpit « Fonctionnalités ») : même
// table user_events, avec un nom stable et la version du schéma de leurs
// métadonnées (v), pour pouvoir changer ce qu'on enregistre sans mélanger
// les anciennes et les nouvelles lignes. Jamais de contenu personnel (CV,
// lettre, réponses) : seulement ce qui sert à compter.
export const PRODUCT_EVENTS = {
  interviewQuizStarted: "interview_quiz_started",
  interviewQuizCompleted: "interview_quiz_completed",
} as const;

export async function logProductEvent(
  userId: string,
  eventType: (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS],
  metadata: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  const { error } = await createClient()
    .from("user_events")
    .insert({ user_id: userId, event_type: eventType, metadata: { v: 1, ...metadata } });
  if (error) console.error("logProductEvent failed", error, { eventType });
}
