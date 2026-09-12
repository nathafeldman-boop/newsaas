// Messages de résultat du simulateur d'entretien, écrits à la main -- ZÉRO
// dépendance IA, même logique que questionBank.ts. Plusieurs variantes par
// palier de score pour éviter l'effet "toujours le même message" déjà
// corrigé sur les lettres de motivation (voir
// src/lib/coverLetter/staticGenerator.ts) : quelqu'un qui repasse le quiz
// une quinzième fois ne doit jamais retomber sur le texte identique avant
// d'avoir vu toutes les variantes du palier. AUCUN palier, même sur un
// score bas, ne doit sonner comme un jugement ou une démotivation -- le mot
// "score", "difficile" ou toute allusion au niveau ne doit jamais
// apparaître dans les paliers bas : uniquement des messages de motivation
// tournés vers la prochaine tentative, jamais un constat d'échec.

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
    "Chaque explication ci-dessous te rapproche un peu plus d'un entretien réussi — continue sur cette lancée.",
    "Tu progresses à chaque tentative : regarde les explications et repars pour un nouvel essai.",
    "C'est exactement à ça que sert ce simulateur : t'entraîner sans pression avant le vrai jour J.",
    "Garde ce rythme d'entraînement, la régularité paie toujours en entretien.",
    "Continue à t'exercer : c'est en répétant qu'on prend confiance pour de bon.",
    "Chaque nouvel essai te rend plus à l'aise — reprends les explications et retente quand tu veux.",
  ],
  difficile: [
    "Ce simulateur est fait pour t'entraîner librement — continue, tu progresses à chaque session.",
    "Garde le cap : c'est en s'entraînant régulièrement qu'on arrive prêt(e) le jour de l'entretien.",
    "Chaque tentative ici te rend plus solide pour le vrai entretien — recommence quand tu veux.",
    "Tu es exactement là où il faut être : en train de t'entraîner activement.",
    "Continue sur cette lancée, la pratique régulière est la clé pour progresser sur ce sujet.",
    "Retente dès que tu veux : c'est en répétant qu'on prend confiance pour de bon.",
  ],
};

export function getInterviewResultMessage(score: number, attempt: number, seedKey: string): string {
  const tier = tierForScore(score);
  return pickNoRepeat(MESSAGES[tier], `${seedKey}::${tier}`, attempt);
}
