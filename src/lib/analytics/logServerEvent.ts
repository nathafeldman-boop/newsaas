import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Équivalent server-side de logButtonClick.ts (qui insère depuis le
// navigateur) -- pour les événements déclenchés dans une server action, où
// on a déjà le client Supabase de la requête sous la main et où l'insertion
// est de toute façon plus fiable faite côté serveur (jamais perdue si
// l'utilisateur ferme l'onglet juste après l'action). Réutilise la même
// table user_events (event_type + metadata jsonb) plutôt qu'un nouveau
// mécanisme -- voir RETENTION_AUDIT.md pour la liste des événements ajoutés.
export async function logServerEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("user_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata: metadata ?? null,
  });
  if (error) {
    console.error("logServerEvent failed", error, { eventType, userId });
  }
}
