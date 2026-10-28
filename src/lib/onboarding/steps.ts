// Étapes de l'onboarding : source de vérité partagée entre le wizard
// ("use client", src/components/onboarding/OnboardingWizard.tsx) et le
// funnel du dashboard admin (Server Component, src/app/admin/page.tsx).
// Vit dans un module à part (pas dans le wizard) : un Server Component ne
// peut pas importer une simple constante depuis un module "use client" --
// le bundler RSC transforme tous ses exports en références client, ce qui
// casse silencieusement dès qu'on essaie de s'en servir comme un tableau
// normal côté serveur ("STEP_IDS is not iterable").
// Écrans de preuve (28/10, Nathan) : après la 3e, la 5e et la 9e question ;
// contrat à l'empreinte après le récap, avant le premier swipe.
export const STEP_IDS = [
  "intro",
  "looking_for",
  "trust",
  "city",
  "sectors",
  "proof_compare",
  "skills",
  "jobs",
  "proof_reviews",
  "mobility",
  "level",
  "dispo",
  "source",
  "proof_demo",
  "cv",
  "outro",
  "pledge",
  "pledge_done",
] as const;

/** Écrans sans question (pas de barre de progression, pas de « Continuer » commun). */
export const NO_CHROME_STEPS: readonly StepId[] = ["intro", "trust", "proof_compare", "proof_reviews", "proof_demo", "outro", "pledge", "pledge_done"];
export type StepId = (typeof STEP_IDS)[number];

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
  source: "Tu nous as connus comment",
  cv: "Ton CV",
  outro: "Récap",
  proof_compare: "Preuve : seul ou avec Stageio",
  proof_reviews: "Preuve : avis",
  proof_demo: "Preuve : démo de l'appli",
  pledge: "Contrat à l'empreinte",
  pledge_done: "Contrat signé",
};
