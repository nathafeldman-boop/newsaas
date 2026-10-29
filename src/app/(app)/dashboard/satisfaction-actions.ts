"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { SATISFACTION_DISMISS_EVENT, SATISFACTION_EVENT, SURVEY_MOMENTS, UNHAPPY_MAX_SCORE, type SurveyMoment } from "@/lib/satisfaction/survey";
import { alertUnhappyCustomer } from "@/lib/satisfaction/alert";

export type SatisfactionState = { done: boolean; score: number | null; error: string | null };

// Réponse à « Stageio t'aide dans ta recherche ? » (tableau de bord des
// abonnés). Notée dans user_events (service_role) ; note de 1 ou 2 :
// email aux admins pour répondre soi-même.
export async function submitSatisfactionAction(_prev: SatisfactionState, formData: FormData): Promise<SatisfactionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { done: false, score: null, error: "Session expirée : recharge la page." };
  const score = Number(formData.get("score"));
  if (!Number.isInteger(score) || score < 1 || score > 5) return { done: false, score: null, error: "Choisis une note." };
  const rawMoment = String(formData.get("moment") ?? "");
  const moment: SurveyMoment = rawMoment in SURVEY_MOMENTS ? (rawMoment as SurveyMoment) : "debut";
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 1000) || null;

  const { data: profile } = await supabase.from("profiles").select("full_name, subscription_status, current_period_end").eq("id", user.id).single();
  if (!isPremium(profile)) return { done: false, score: null, error: null };

  const { error } = await createAdminClient()
    .from("user_events")
    .insert({ user_id: user.id, event_type: SATISFACTION_EVENT, metadata: { score, comment, moment } });
  if (error) {
    console.error("submitSatisfactionAction: insert failed", error.message, { userId: user.id });
    return { done: false, score, error: "Réponse non enregistrée, réessaie dans un instant." };
  }
  if (score <= UNHAPPY_MAX_SCORE) {
    after(() =>
      alertUnhappyCustomer({ userId: user.id, email: user.email ?? null, name: profile?.full_name ?? null, score, comment, moment: SURVEY_MOMENTS[moment].label }).catch((err) =>
        console.error("submitSatisfactionAction: alerte non envoyée", err instanceof Error ? err.message : err),
      ),
    );
  }
  return { done: true, score, error: null };
}

export async function dismissSatisfactionAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await createAdminClient().from("user_events").insert({ user_id: user.id, event_type: SATISFACTION_DISMISS_EVENT, metadata: {} });
}
