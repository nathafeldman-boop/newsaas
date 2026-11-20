// Test A/B d'entrée (18/11). Sur les pages publiques, le premier clic d'un
// visiteur non connecté l'envoie, selon son groupe, sur la page d'accueil
// (« lp ») ou directement sur l'inscription (« inscription »). Groupe tiré
// au hasard à la première visite (proxy.ts), gardé 30 jours. Fin du test :
// AB_ENTRY_WINNER (variable Vercel) met tout le monde dans le groupe gagnant.
export const AB_ENTRY_COOKIE = "ab_entry";
export const AB_ENTRY_VARIANTS = ["lp", "inscription"] as const;
export type AbEntryVariant = (typeof AB_ENTRY_VARIANTS)[number];
export const AB_ENTRY_START = "2026-11-19";

export function isAbEntryVariant(v: unknown): v is AbEntryVariant {
  return v === "lp" || v === "inscription";
}

export function abEntryDestination(v: AbEntryVariant): string {
  return v === "lp" ? "/" : "/inscription";
}

// Pages où le premier clic ne redirige pas : l'accueil et l'inscription
// elles-mêmes, l'appli, l'admin, les pages de compte, de paiement et légales.
const EXCLUDED = /^\/($|inscription|login|onboarding|auth|admin|api|createurs|accord-parental|paiement|paiement-recu|premium|desabonnement|pourquoi|compte-supprime|legal|swipe|dashboard|favoris|mes-candidatures|candidature|cv|profil|parrainage|affilies|boite|spontanees|stages-scolaires|widget)(\/|$)/;

// Test arrêté le 20/11 (Nathan : « on revient au parcours du 31/10 ») :
// plus de tirage ni de redirection au premier clic.
export const AB_ENTRY_ACTIVE = false;

export function abEntryApplies(pathname: string): boolean {
  return AB_ENTRY_ACTIVE && !EXCLUDED.test(pathname);
}
