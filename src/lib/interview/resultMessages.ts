// Messages de résultat du simulateur d'entretien, écrits à la main -- ZÉRO
// dépendance IA, même logique que questionBank.ts. Plusieurs variantes par
// palier de score pour éviter l'effet "toujours le même message" déjà
// corrigé sur les lettres de motivation (voir
// src/lib/coverLetter/staticGenerator.ts) : quelqu'un qui repasse le quiz
// une quinzième fois ne doit jamais retomber sur le texte identique avant
// d'avoir vu toutes les variantes du palier. Les paliers bas ("moyen",
// "difficile") sont volontairement encourageants -- jamais moralisateurs ni
// décourageants -- pour ne pas casser l'envie de retenter juste après un
// mauvais score.

function seededHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickNoRepeat<T>(arr: T[], seedKey: string, attempt: number): T {
  if (arr.length === 1) return arr[0];
  const n = arr.length;
  const cycle = Math.floor(attempt / n);
  const posInCycle = attempt % n;
  const shuffled = seededShuffle(arr, seededHash(seedKey) + cycle * 7919);
  // Deux cycles mélangés indépendamment peuvent, par coïncidence, placer le
  // même élément en dernière position du cycle précédent et en première
  // position de celui-ci -- un vrai bug de répétition à la frontière entre
  // deux cycles, découvert en validant ce module. On le neutralise en
  // permutant les deux premières positions du nouveau cycle dans ce cas --
  // fait à chaque appel (pas seulement quand posInCycle === 0) pour que le
  // tableau "shuffled" reste identique quelle que soit la position demandée
  // dans ce cycle.
  if (cycle > 0) {
    const prevShuffled = seededShuffle(arr, seededHash(seedKey) + (cycle - 1) * 7919);
    if (shuffled[0] === prevShuffled[n - 1]) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
  }
  return shuffled[posInCycle];
}

type ResultTier = "parfait" | "excellent" | "bon" | "moyen" | "difficile";

function tierForScore(score: number): ResultTier {
  if (score === 100) return "parfait";
  if (score >= 80) return "excellent";
  if (score >= 60) return "bon";
  if (score >= 40) return "moyen";
  return "difficile";
}

const MESSAGES: Record<ResultTier, string[]> = {
  parfait: [
    "Score parfait, aucune question ratée. 🎉",
    "100% : sans faute sur ce niveau, bravo !",
    "Aucune erreur — ce domaine, tu le maîtrises vraiment. 🔥",
    "Carton plein ! Tu peux tenter le niveau au-dessus en confiance.",
    "Rien à redire, c'est un sans-faute impeccable.",
    "Parfait du début à la fin — ce genre d'entretien ne te fait plus peur.",
  ],
  excellent: [
    "Très bon score : tu maîtrises largement ce domaine.",
    "Excellent niveau — encore une ou deux questions et c'était le sans-faute.",
    "Belle performance, tu es clairement prêt(e) pour ce type d'entretien.",
    "Ton niveau est déjà solide, regarde juste les quelques points ci-dessous.",
    "Très solide ! Ce qui suit, ce sont des détails à peaufiner.",
    "Un excellent résultat qui montre que tu connais bien le sujet.",
  ],
  bon: [
    "Bon score, avec quelques points à revoir ci-dessous.",
    "Une bonne base — les explications qui suivent vont t'aider à progresser.",
    "Tu es sur la bonne voie, ces quelques erreurs sont normales à ce stade.",
    "Résultat correct : regarde les points ratés, ils valent le coup d'œil.",
    "Pas mal du tout — encore un peu d'entraînement et ce sera nickel.",
    "Un bon niveau général, avec quelques angles morts à combler.",
  ],
  moyen: [
    "Score moyen, mais c'est justement fait pour repérer ce qu'il te reste à travailler.",
    "Ne te décourage pas : chaque question ratée ici t'évite une vraie erreur en entretien.",
    "C'est un entraînement, pas un examen — regarde les explications et retente.",
    "Résultat mitigé, mais tu sais maintenant précisément où concentrer tes révisions.",
    "Ce n'est qu'un point de départ : reprends les explications et relance un essai.",
    "Encore du travail, mais rien d'insurmontable — les explications ci-dessous sont là pour ça.",
  ],
  difficile: [
    "Ce niveau était corsé — c'est normal de ne pas tout avoir du premier coup, regarde les explications et retente.",
    "Ne te décourage surtout pas : ce quiz sert justement à repérer ce qui manque avant le vrai entretien.",
    "Un score bas ici n'a rien de grave, c'est un entraînement sans enjeu — relis les explications et refais un essai.",
    "Beaucoup de points à revoir, mais chaque explication ci-dessous est une vraie occasion de progresser.",
    "C'était clairement difficile pour toi sur ce coup — commence peut-être par le niveau facile pour construire les bases.",
    "Pas le résultat espéré, mais rien n'est perdu : reprends calmement chaque explication avant de retenter.",
  ],
};

export function getInterviewResultMessage(score: number, attempt: number, seedKey: string): string {
  const tier = tierForScore(score);
  return pickNoRepeat(MESSAGES[tier], `${seedKey}::${tier}`, attempt);
}
