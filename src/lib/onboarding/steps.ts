// Étapes de l'onboarding : source de vérité partagée entre le wizard
// ("use client", src/components/onboarding/OnboardingWizard.tsx) et le
// funnel du dashboard admin (Server Component, src/app/admin/page.tsx).
// Vit dans un module à part (pas dans le wizard) : un Server Component ne
// peut pas importer une simple constante depuis un module "use client" --
// le bundler RSC transforme tous ses exports en références client, ce qui
// casse silencieusement dès qu'on essaie de s'en servir comme un tableau
// normal côté serveur ("STEP_IDS is not iterable").
export const STEP_IDS = ["intro", "looking_for", "search", "cv", "outro"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  intro: "Bienvenue",
  looking_for: "Toi",
  search: "Ta recherche",
  cv: "Ton CV",
  outro: "Récap",
};
