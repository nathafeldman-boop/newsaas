// Étapes de l'onboarding : source de vérité partagée entre le wizard
// ("use client", src/components/onboarding/OnboardingWizard.tsx) et le
// funnel du dashboard admin (Server Component, src/app/admin/page.tsx).
// Vit dans un module à part (pas dans le wizard) : un Server Component ne
// peut pas importer une simple constante depuis un module "use client" --
// le bundler RSC transforme tous ses exports en références client, ce qui
// casse silencieusement dès qu'on essaie de s'en servir comme un tableau
// normal côté serveur ("STEP_IDS is not iterable").
// Toutes les étapes qui existent dans le wizard (le type), et ci-dessous le
// parcours réellement joué.
export const ALL_STEP_IDS = [
  "intro",
  "looking_for",
  "trust",
  "city",
  "sectors",
  "skills",
  "jobs",
  "mobility",
  "level",
  "dispo",
  "cv",
  "outro",
] as const;
export type StepId = (typeof ALL_STEP_IDS)[number];

// Parcours express (17/10, checklist « landing qui convertit » : inscription
// en 30 s avant le paywall ; SOP 03 : 4 questions max) : 4 écrans en un ou
// deux taps -- la mobilité est posée sur l'écran de la ville --, puis le récap.
// Retirés du parcours : bienvenue, écran de confiance, compétences, métiers
// visés, disponibilité et CV -- tous modifiables ensuite depuis /profil.
// Gardés : ce qui fait la pertinence du deck (contrat, secteurs = filtre
// dur du deck, ville + mobilité = pénalité de distance, niveau).
export const STEP_IDS: readonly StepId[] = ["looking_for", "sectors", "city", "level", "outro"];

export const STEP_LABELS: Record<StepId, string> = {
  intro: "Bienvenue",
  looking_for: "Ton projet",
  trust: "Confiance",
  city: "Ta ville",
  sectors: "Secteurs",
  skills: "Compétences",
  jobs: "Métiers",
  mobility: "Mobilité",
  level: "Ton niveau",
  dispo: "Disponibilité",
  cv: "Ton CV",
  outro: "Récap",
};
