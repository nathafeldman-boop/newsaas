// Simulateur d'entretien : réponses mélangées sans casser la correction,
// position de la bonne réponse répartie, progression par domaine.
// Lancer : npx tsx --tsconfig tsconfig.json tests/interview-session.test.ts
import assert from "node:assert/strict";
import { INTERVIEW_DOMAINS, getInterviewQuestions } from "../src/lib/interview/questionBank";
import { buildQuiz, nextLevel, progressFor, shuffledQuestions } from "../src/lib/interview/session";

// La bonne réponse reste la même après mélange, pour toutes les questions.
const positions = [0, 0, 0, 0, 0];
let seed = 1;
for (const d of INTERVIEW_DOMAINS) {
  for (const level of ["facile", "medium", "difficile"] as const) {
    const original = getInterviewQuestions(d.id, level);
    const byText = new Map(original.map((q) => [q.question, q.options[q.correctIndex]]));
    const quiz = shuffledQuestions(original, seed++);
    assert.equal(quiz.length, original.length);
    for (const q of quiz) {
      assert.equal(q.options[q.correctIndex], byText.get(q.question), `${d.id}/${level}: ${q.question}`);
      assert.equal(new Set(q.options).size, q.options.length);
      positions[q.correctIndex]++;
    }
  }
}
// Avant : 92 % en 2e position. Après : aucune position au-dessus de 30 %.
const total = positions.reduce((a, b) => a + b, 0);
assert.ok(Math.max(...positions) / total < 0.3, `répartition ${positions}`);
// Même graine, même partie (reprise) ; graine différente, ordre différent.
const a = shuffledQuestions(getInterviewQuestions("commerce", "medium").sort((x, y) => x.question.localeCompare(y.question)), 42);
const b = shuffledQuestions(getInterviewQuestions("commerce", "medium").sort((x, y) => x.question.localeCompare(y.question)), 42);
assert.deepEqual(a, b);
assert.equal(buildQuiz("commerce", "facile", 7).length, 5);

assert.equal(nextLevel("facile"), "medium");
assert.equal(nextLevel("difficile"), null);

const p = progressFor(
  [
    { domain: "commerce", level: "facile", score: 60, at: "2026-10-20T10:00:00Z" },
    { domain: "commerce", level: "facile", score: 100, at: "2026-10-21T10:00:00Z" },
    { domain: "commerce", level: "facile", score: 80, at: "2026-10-22T10:00:00Z" },
    { domain: "rh", level: "medium", score: 50, at: "2026-10-22T10:00:00Z" },
  ],
  "commerce",
);
assert.deepEqual(p.facile, { best: 100, last: 80, runs: 3 });
assert.equal(p.medium, null);

console.log(`interview-session: OK (bonne réponse par position : ${positions.join(" / ")})`);
