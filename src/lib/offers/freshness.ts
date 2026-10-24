// Fraîcheur affichée sur la carte, calculée à la volée depuis published_at
// (date de création chez la source, à la seconde pour France Travail) :
// jamais stockée, ne peut pas se dé-synchroniser. Moins de 24 h : à la
// minute près et en « chaud » (24/10, Nathan : « elle est là depuis
// 2 heures, tu dois la prendre ») ; muette au-delà de 7 jours.
export type Freshness = { label: string; hot: boolean };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const HOT_OFFER_MS = DAY;

export function getFreshness(publishedAt: string, now: number = Date.now()): Freshness | null {
  const age = now - new Date(publishedAt).getTime();
  if (!Number.isFinite(age)) return null;
  if (age < MINUTE) return { label: "Publiée à l'instant", hot: true };
  if (age < HOUR) return { label: `Publiée il y a ${Math.floor(age / MINUTE)} min`, hot: true };
  if (age < DAY) return { label: `Publiée il y a ${Math.floor(age / HOUR)} h`, hot: true };
  if (age < 2 * DAY) return { label: "Publiée hier", hot: false };
  const days = Math.floor(age / DAY);
  return days <= 7 ? { label: `Publiée il y a ${days} jours`, hot: false } : null;
}

// Durée courte pour les listes (« 12 min », « 3 h »).
export function shortAge(publishedAt: string, now: number = Date.now()): string {
  const age = Math.max(0, now - new Date(publishedAt).getTime());
  if (age < MINUTE) return "à l'instant";
  if (age < HOUR) return `il y a ${Math.floor(age / MINUTE)} min`;
  if (age < DAY) return `il y a ${Math.floor(age / HOUR)} h`;
  return age < 2 * DAY ? "hier" : `il y a ${Math.floor(age / DAY)} j`;
}

// Deck : les offres de moins de 24 h passent devant, à condition de bien
// matcher (score au moins celui de la dernière carte du deck, ou 70) --
// jamais une offre hors sujet juste parce qu'elle est neuve. Le score
// affiché reste le vrai score, seul l'ordre change.
export function orderFreshFirst<T extends { id: string; published_at: string }>(
  ranked: T[],
  scores: Record<string, number>,
  deckSize: number,
  now: number = Date.now(),
): { deck: T[]; freshPicks: T[] } {
  const last = ranked[Math.min(deckSize, ranked.length) - 1];
  const bar = Math.min(last ? (scores[last.id] ?? 0) : 0, 70);
  const freshPicks = ranked.filter((o) => now - new Date(o.published_at).getTime() < HOT_OFFER_MS && (scores[o.id] ?? 0) >= bar);
  const freshIds = new Set(freshPicks.map((o) => o.id));
  return { deck: [...freshPicks, ...ranked.filter((o) => !freshIds.has(o.id))].slice(0, deckSize), freshPicks };
}

export function hotSinceIso(now: number = Date.now()): string {
  return new Date(now - HOT_OFFER_MS).toISOString();
}
