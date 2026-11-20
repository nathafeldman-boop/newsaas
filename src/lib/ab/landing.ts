// Test A/B de la page d'accueil (19/11, Nathan : « fais la LP de Wapply en
// test A/B »). À la première ouverture de « / », le visiteur est tiré au
// hasard : « a » garde la page actuelle, « b » reçoit la page façon Wapply
// (/accueil-b, servie à la même adresse par proxy.ts). Groupe gardé 30
// jours. Mesure : site_visits (campagne ab-lp-<groupe>) pour les visiteurs,
// profiles.landing_path (« / » ou « /?lp=b ») pour les inscrits.
// Fin du test : AB_LP_WINNER (variable Vercel, « a » ou « b ») met tout le
// monde sur la gagnante.
export const AB_LP_COOKIE = "ab_lp";
export type AbLpVariant = "a" | "b";
export const LANDING_B_PATH = "/accueil-b";

export function isAbLpVariant(v: unknown): v is AbLpVariant {
  return v === "a" || v === "b";
}

// Test arrêté le 20/11 (Nathan) : tout le monde voit l'accueil A, le seul du 31/10.
export const AB_LP_ACTIVE = false;
