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
  "quick_job",
  "looking_for",
  "proof_offers",
  "quick_criteria",
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
  "urgency",
  "source",
  "proof_demo",
  "proof_week",
  "cv",
  "outro",
  "pledge",
  "pledge_done",
] as const;

/** Écrans sans question (pas de barre de progression, pas de « Continuer » commun). */
export const NO_CHROME_STEPS: readonly StepId[] = ["intro", "trust", "proof_offers", "proof_week", "proof_compare", "proof_reviews", "proof_demo", "urgency", "outro", "pledge", "pledge_done"];
export type StepId = (typeof STEP_IDS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  intro: "Bienvenue",
  looking_for: "Ton projet",
  trust: "Confiance",
  quick_job: "Le métier",
  quick_criteria: "Tes critères",
  proof_offers: "Preuve : offres en ligne",
  proof_week: "Preuve : offres de la semaine",
  city: "Ta ville",
  sectors: "Secteurs",
  skills: "Compétences",
  jobs: "Métiers",
  mobility: "Mobilité",
  level: "Ton niveau",
  dispo: "Disponibilité",
  urgency: "Le temps presse",
  source: "Tu nous as connus comment",
  cv: "Ton CV",
  outro: "Récap",
  proof_compare: "Preuve : seul ou avec Stageio",
  proof_reviews: "Preuve : avis",
  proof_demo: "Preuve : démo de l'appli",
  pledge: "Contrat à l'empreinte",
  pledge_done: "Contrat signé",
};

// Test A/B d'onboarding (19/11, Nathan : « copie juste l'onboarding de
// Wapply, le reste tu le gardes comme avant », preuves identiques dans les
// deux versions).
// A = onboarding actuel, avec les preuves P1 (offres en ligne, à la place de
// « Confiance »), P2 (avis) et P3 (offres de la semaine, avant le CV).
// B = parcours Wapply : le métier, puis contrat + niveau + ville + rayon sur
// un seul écran, puis la suite habituelle (CV, récap, contrat, swipe).
// 20/11 (Nathan : « remets le parcours du 31/10 ») : A = les écrans du 31/10,
// sans les preuves ajoutées depuis (offres en ligne, urgence, offres de la semaine).
export const STEPS_A: readonly StepId[] = STEP_IDS.filter((s) => !["quick_job", "quick_criteria", "proof_offers", "urgency", "proof_week"].includes(s));
export const STEPS_B: readonly StepId[] = ["quick_job", "proof_offers", "quick_criteria", "proof_reviews", "proof_week", "cv", "outro", "pledge", "pledge_done"];

/** Début du test : les comptes créés avant gardent l'onboarding A. */
export const AB_ONBOARDING_START = "2026-11-19T18:35:00Z";

/**
 * Groupe du test, tiré de l'id du compte (uuid aléatoire) : 50/50, stable,
 * sans cookie ni colonne. En SQL : substr(id::text, 1, 1) < '8' → B.
 */
export function onboardingVariant(userId: string, createdAt: string | null | undefined): "a" | "b" {
  // Test arrêté le 20/11 : tout le monde sur A.
  void userId;
  void createdAt;
  return "a";
}
