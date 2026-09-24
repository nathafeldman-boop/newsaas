"use server";

import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { buildJimmyContext } from "@/lib/jimmy/buildContext";
import { askJimmy } from "@/lib/jimmy/chat";
import { logServerEvent } from "@/lib/analytics/logServerEvent";

const MAX_HISTORY_FOR_PROMPT = 20;
// Capé côté application (pas en base) pour ne pas grossir indéfiniment --
// une conversation Jimmy n'a pas besoin de conserver un historique complet
// depuis toujours, juste assez pour garder le fil récent.
const MAX_STORED_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2000;

export type SendJimmyMessageResult =
  | { status: "success"; reply: string }
  | { status: "error"; message: string };

// Jimmy, copilote IA (section 8 de l'audit) -- Premium uniquement, jamais un
// simple gadget : contexte réel du compte reconstruit à chaque message (voir
// buildJimmyContext), jamais de fausse réponse quand Gemini n'est pas
// configuré ou échoue. Contrairement à la lettre de motivation/l'audit CV,
// il n'existe pas de repli statique crédible pour une conversation libre --
// on préfère un message d'erreur honnête à une réponse générique déguisée
// en IA.
export async function sendJimmyMessageAction(message: string): Promise<SendJimmyMessageResult> {
  const trimmed = message.trim();
  if (!trimmed) return { status: "error", message: "Écris un message avant d'envoyer." };
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { status: "error", message: "Message trop long, essaie plus court." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  if (!isPremium(profile)) {
    return { status: "error", message: "Jimmy est réservé aux membres Premium (7,99€/mois)." };
  }

  if (!isGeminiConfigured()) {
    return { status: "error", message: "Jimmy n'est pas encore configuré, réessaie plus tard." };
  }

  const { data: priorMessages } = await supabase
    .from("jimmy_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_FOR_PROMPT);
  const history = (priorMessages ?? []).slice().reverse();

  const { error: insertUserError } = await supabase
    .from("jimmy_messages")
    .insert({ user_id: user.id, role: "user", content: trimmed });
  if (insertUserError) {
    console.error("sendJimmyMessageAction: user message insert failed", insertUserError, { userId: user.id });
  }

  try {
    const context = await buildJimmyContext(supabase, user.id);
    const reply = await askJimmy(context, history, trimmed);

    const { error: insertAssistantError } = await supabase
      .from("jimmy_messages")
      .insert({ user_id: user.id, role: "assistant", content: reply });
    if (insertAssistantError) {
      console.error("sendJimmyMessageAction: assistant message insert failed", insertAssistantError, {
        userId: user.id,
      });
    }

    await logServerEvent(supabase, user.id, "jimmy_message", { length: trimmed.length });
    await trimJimmyHistory(supabase, user.id);

    return { status: "success", reply };
  } catch (err) {
    console.error("sendJimmyMessageAction: Jimmy a échoué", err, { userId: user.id });
    return { status: "error", message: "Jimmy n'a pas pu répondre, réessaie dans un instant." };
  }
}

async function trimJimmyHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<void> {
  const { data: rows } = await supabase
    .from("jimmy_messages")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (!rows || rows.length <= MAX_STORED_MESSAGES) return;

  const idsToDelete = rows.slice(MAX_STORED_MESSAGES).map((r) => r.id);
  if (idsToDelete.length === 0) return;

  const { error } = await supabase.from("jimmy_messages").delete().in("id", idsToDelete);
  if (error) {
    console.error("trimJimmyHistory failed", error, { userId });
  }
}
