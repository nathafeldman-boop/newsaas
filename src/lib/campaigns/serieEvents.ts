// Série d'emails Premium (Nathan, 24/10) : 5 emails au plus, un tous les 2-3
// jours, chacun noté avec son numéro (metadata.step). Fichier à part, sans
// dépendance : lu aussi par le calcul du prix de bienvenue.
export const SALES_SERIES_EVENT = "email_serie_premium_2026_10";

// Relance quotidienne des paiements Stripe non finalisés (25/10), une par
// jour et par compte, cinq au plus (voir relanceCheckoutDaily.ts).
export const CHECKOUT_DAILY_EVENT = "email_relance_checkout_quotidienne";

// Email « tu as regardé Premium » du 7/11 (lib/campaigns/prixVus.ts), une
// fois par compte : le prix de bienvenue repart de zéro au clic.
export const PRICES_SEEN_EVENT = "email_prix_vus_2026_11";
