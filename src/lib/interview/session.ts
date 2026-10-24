import { getInterviewQuestions, type InterviewLevel, type InterviewQuestion } from "@/lib/interview/questionBank";

// Partie de simulateur (24/10, mission churn). La banque place la bonne
// réponse en 2e position dans 92 % des questions (911 sur 990) : un étudiant
// le repère en une partie et l'entraînement ne vaut plus rien. Les réponses
// sont donc mélangées à chaque partie, avec une graine pour qu'une partie
// interrompue reprenne à l'identique.

export const LEVEL_ORDER: InterviewLevel[] = ["facile", "medium", "difficile"];
export const LEVEL_LABELS: Record<InterviewLevel, string> = { facile: "Facile", medium: "Médium", difficile: "Difficile" };
export const MASTERY_SCORE = 80;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Questions dans un ordre mélangé, et réponses de chaque question mélangées. */
export function shuffledQuestions(questions: InterviewQuestion[], seed: number): InterviewQuestion[] {
  const rand = mulberry32(seed);
  return shuffle(questions, rand).map((q) => {
    const order = shuffle(
      q.options.map((_, i) => i),
      rand,
    );
    return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
  });
}

export function buildQuiz(domainId: string, level: InterviewLevel, seed: number): InterviewQuestion[] {
  return shuffledQuestions(getInterviewQuestions(domainId, level), seed);
}

export function nextLevel(level: InterviewLevel): InterviewLevel | null {
  return LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1] ?? null;
}

export type QuizResult = { domain: string; level: InterviewLevel; score: number; at: string };

/** Meilleur et dernier score par niveau, pour un domaine. */
export function progressFor(results: QuizResult[], domain: string): Record<InterviewLevel, { best: number; last: number; runs: number } | null> {
  const out: Record<InterviewLevel, { best: number; last: number; runs: number } | null> = { facile: null, medium: null, difficile: null };
  const sorted = results.filter((r) => r.domain === domain).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const r of sorted) {
    const cur = out[r.level];
    out[r.level] = { best: Math.max(cur?.best ?? 0, r.score), last: r.score, runs: (cur?.runs ?? 0) + 1 };
  }
  return out;
}
