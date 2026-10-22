// Étapes de l'onboarding : source de vérité partagée entre le wizard
// ("use client", src/components/onboarding/OnboardingWizard.tsx) et le
// funnel du dashboard admin (Server Component, src/app/admin/page.tsx).
// Vit dans un module à part (pas dans le wizard) : un Server Component ne
// peut pas importer une simple constante depuis un module "use client" --
// le bundler RSC transforme tous ses exports en références client, ce qui
// casse silencieusement dès qu'on essaie de s'en servir comme un tableau
// normal côté serveur ("STEP_IDS is not iterable").
//
// 22/10 (fiche « Pricing & hard paywall » : onboarding en 3-4 écrans ;
// Nathan : « compacte tout en 4 écrans mais ne change pas les demandes ») :
// les 10 questions sont gardées, regroupées sur 4 écrans, puis le récap.
// Bienvenue et confiance retirés (le vrai nombre d'inscrits est montré
// avant le paywall).
export const QUESTION_IDS = [
  "looking_for",
  "city",
  "mobility",
  "sectors",
  "jobs",
  "level",
  "skills",
  "dispo",
  "cv",
  "source",
] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export const STEP_IDS = ["projet", "recherche", "profil", "dernier", "outro"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const QUESTION_SCREEN: Record<QuestionId, StepId> = {
  looking_for: "projet",
  city: "projet",
  mobility: "projet",
  sectors: "recherche",
  jobs: "recherche",
  level: "profil",
  skills: "profil",
  dispo: "profil",
  cv: "dernier",
  source: "dernier",
};

export const STEP_LABELS: Record<StepId, string> = {
  projet: "Ton projet",
  recherche: "Ta recherche",
  profil: "Ton profil",
  dernier: "Dernière étape",
  outro: "Récap",
};
