import type { Offer, SwipeDirection } from "@/types/database";

// Le score de base (computeMatchScore) ne regarde que les réponses statiques
// de l'onboarding -- il ne "retient" jamais qu'un profil a liké 8 offres en
// data à Lyon et passé toutes les offres en communication. Ce module ajoute
// cette couche : un profil d'affinité reconstruit à chaque chargement de
// /swipe à partir de l'historique réel de swipes/candidatures, utilisé comme
// bonus additif sur le score existant (jamais comme un score à part).

export type SwipeHistoryEntry = {
  direction: SwipeDirection;
  applied: boolean;
  offer: Pick<Offer, "sector" | "title" | "remote_policy">;
};

const STOPWORDS = new Set([
  "de", "des", "du", "le", "la", "les", "un", "une", "et", "en", "pour", "dans", "avec", "sur",
  "au", "aux", "chez", "vos", "nos", "notre", "votre", "stage", "alternance", "junior", "poste",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function extractKeywords(title: string): string[] {
  return normalize(title)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

type Stat = { weight: number; count: number };

function bump(map: Map<string, Stat>, rawKey: string, weight: number) {
  const key = normalize(rawKey);
  const cur = map.get(key) ?? { weight: 0, count: 0 };
  cur.weight += weight;
  cur.count += 1;
  map.set(key, cur);
}

// En dessous de 2 occurrences, un seul like/pass isolé ne dit rien de fiable
// sur une préférence -- mieux vaut ignorer le signal que sur-réagir à un
// swipe hâtif.
const MIN_SAMPLES = 2;

function scoreFrom(map: Map<string, Stat>, rawKey: string | null, cap: number): number {
  if (!rawKey) return 0;
  const stat = map.get(normalize(rawKey));
  if (!stat || stat.count < MIN_SAMPLES) return 0;
  const avg = stat.weight / stat.count;
  return Math.max(-cap, Math.min(cap, avg * 4));
}

export type LearnedAffinity = {
  sectorBonus: (sector: string | null) => number;
  remoteBonus: (remotePolicy: string | null) => number;
  keywordBonus: (title: string) => number;
  /** Vrai si un signal de contenu (secteur/mots-clés) pousse nettement cette
   * offre vers le haut -- sert à afficher "Proche d'offres que tu as aimées"
   * dans la carte plutôt que de laisser le bonus invisible. */
  isStrongContentMatch: (offer: Pick<Offer, "sector" | "title">) => boolean;
  sampleSize: number;
};

export function buildLearnedAffinity(history: SwipeHistoryEntry[]): LearnedAffinity {
  const sectorStats = new Map<string, Stat>();
  const remoteStats = new Map<string, Stat>();
  const keywordStats = new Map<string, Stat>();

  for (const entry of history) {
    // Une candidature réelle est le signal le plus fort qu'on ait -- un like
    // peut être impulsif pendant que candidater est un vrai engagement.
    // pass = signal négatif clair.
    const weight = entry.applied ? 3 : entry.direction === "like" ? 1 : -1;
    if (entry.offer.sector) bump(sectorStats, entry.offer.sector, weight);
    if (entry.offer.remote_policy) bump(remoteStats, entry.offer.remote_policy, weight);
    for (const kw of extractKeywords(entry.offer.title)) bump(keywordStats, kw, weight);
  }

  function keywordBonusOf(title: string): number {
    const kws = extractKeywords(title);
    if (kws.length === 0) return 0;
    const scored = kws.map((k) => scoreFrom(keywordStats, k, 6)).filter((s) => s !== 0);
    if (scored.length === 0) return 0;
    return scored.reduce((a, b) => a + b, 0) / scored.length;
  }

  return {
    sectorBonus: (sector) => scoreFrom(sectorStats, sector, 8),
    remoteBonus: (remote) => scoreFrom(remoteStats, remote, 6),
    keywordBonus: keywordBonusOf,
    isStrongContentMatch: (offer) =>
      scoreFrom(sectorStats, offer.sector, 8) >= 4 || keywordBonusOf(offer.title) >= 3,
    sampleSize: history.length,
  };
}
