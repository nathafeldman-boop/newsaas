import { createClient } from "@/lib/supabase/client";

// Brique générique pour le suivi du funnel côté admin ("sur quel bouton il a
// cliqué") -- réutilise user_events (déjà en place pour le funnel
// onboarding, voir OnboardingWizard.tsx) plutôt qu'une nouvelle table.
// `source` distingue les différents emplacements d'un même bouton répété
// plusieurs fois dans l'app (ex: le CTA Premium apparaît sur ~7 écrans
// différents) -- sans ça, un clic ne dirait jamais QUELLE offre payante a
// donné envie de cliquer, seulement qu'un CTA générique a été touché.
export async function logButtonClick(
  userId: string,
  button: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("user_events").insert({
    user_id: userId,
    event_type: "button_click",
    metadata: {
      button,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      ...extra,
    },
  });
  if (error) {
    console.error("logButtonClick failed", error, { button, extra });
  }
}
