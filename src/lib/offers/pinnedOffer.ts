import { extractOfferId } from "@/lib/offers/publicUrl";

// Retour sur l'offre cliquée (6/11, Nathan : « dès qu'ils cliquent dessus,
// il y a l'onboarding, mais ça les ramène directement sur ces offres-là ») :
// l'ouverture d'une fiche publique /offres/<slug> (post LinkedIn, Google…)
// note l'offre dans un cookie (proxy.ts), et le paquet de /swipe la met en
// première carte, tant qu'elle est en ligne et que la personne ne l'a ni
// likée, ni passée récemment, ni envoyée. Sans dépendance serveur : lu par
// le proxy, la page et les tests.

export const PINNED_OFFER_COOKIE = "offre_vue";
/** 3 jours : le temps de s'inscrire, sans épingler pour toujours une vieille visite. */
export const PINNED_OFFER_MAX_AGE = 60 * 60 * 24 * 3;

/** Offre d'une fiche publique (/offres/<slug>), sinon null (listes, villes, secteurs…). */
export function offerIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/offres\/([^/]+)\/?$/);
  return match ? extractOfferId(match[1]) : null;
}

/** Valeur du cookie, si c'est bien un identifiant d'offre. */
export function pinnedOfferId(value: string | null | undefined): string | null {
  return value ? extractOfferId(value) : null;
}

/** L'offre épinglée en tête, une seule fois, sans dépasser la taille du paquet. */
export function pinFirst<T extends { id: string }>(deck: T[], pinned: T | null, size: number): T[] {
  if (!pinned) return deck;
  return [pinned, ...deck.filter((o) => o.id !== pinned.id)].slice(0, size);
}
