// Accent du thème sombre de l'admin (17/11), mémorisé dans un cookie.
// Fichier partagé serveur/client : une constante exportée d'un module
// « use client » n'est pas lisible côté serveur.
export const ADMIN_ACCENT_COOKIE = "admin_accent";
export type AdminAccent = "violet" | "vert";
