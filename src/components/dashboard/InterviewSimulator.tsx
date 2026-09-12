"use client";

import { useState } from "react";
import {
  generateInterviewQuizAction,
  type GenerateQuizResult,
} from "@/app/(app)/dashboard/actions";
import {
  QUESTION_COUNT_BY_LEVEL,
  type InterviewLevel,
  type InterviewQuestion,
} from "@/lib/groq/generateInterviewQuiz";

const LEVELS: { value: InterviewLevel; label: string; hint: string }[] = [
  { value: "facile", label: "Facile", hint: `${QUESTION_COUNT_BY_LEVEL.facile} questions · débutant` },
  { value: "medium", label: "Médium", hint: `${QUESTION_COUNT_BY_LEVEL.medium} questions · intermédiaire` },
  { value: "difficile", label: "Difficile", hint: `${QUESTION_COUNT_BY_LEVEL.difficile} questions · avancé` },
];

// Pool de secours pour "🎲 Aléatoire" : volontairement générique (pas lié au
// profil) plutôt qu'une vraie génération IA d'un métier au hasard -- ça
// suffit à varier l'entraînement sans coût ni latence supplémentaire.
const RANDOM_JOB_POOL = [
  "Développeur web",
  "Chargé de marketing digital",
  "Assistant ressources humaines",
  "Chargé de communication",
  "Commercial B2B",
  "Assistant comptable",
  "Chef de projet junior",
  "Community manager",
  "Data analyst",
  "Designer UX/UI",
  "Assistant achats",
  "Technicien support informatique",
  "Chargé de clientèle",
  "Assistant marketing",
  "Gestionnaire de paie",
];

type Phase = "setup" | "quiz" | "results";

export function InterviewSimulator({
  isPremium,
  defaultJob,
}: {
  isPremium: boolean;
  defaultJob: string;
}) {
  const [level, setLevel] = useState<InterviewLevel | null>(null);
  const [job, setJob] = useState(defaultJob);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPremium) {
    return (
      <div className="card elev-sm" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 32, margin: 0 }}>🎤</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: "10px 0 0" }}>
          Simulateur d&apos;entretien
        </p>
        <p
          style={{
            fontSize: 13,
            margin: "6px 0 0",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          Entraîne-toi avec un entretien à choix multiples adapté à ton métier visé, sur 3
          niveaux de difficulté, avec un score et des explications à la fin.
        </p>
        <a href="/premium" className="btn btn-primary mt-4" style={{ whiteSpace: "nowrap" }}>
          🔓 Débloquer avec Premium (7,99€/mois)
        </a>
      </div>
    );
  }

  async function startQuiz() {
    if (!level) return;
    setLoading(true);
    setError(null);
    const result: GenerateQuizResult = await generateInterviewQuizAction(job, level);
    setLoading(false);

    if (result.status === "success") {
      setQuestions(result.questions);
      setAnswers(new Array(result.questions.length).fill(null));
      setCurrentIndex(0);
      setPhase("quiz");
    } else if (result.status === "premium_required") {
      setError("Cette fonctionnalité est réservée aux membres Premium.");
    } else {
      setError(result.message);
    }
  }

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  function goNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase("results");
    }
  }

  function restart() {
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setError(null);
  }

  if (phase === "quiz") {
    const question = questions[currentIndex];
    const selected = answers[currentIndex];
    return (
      <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            margin: 0,
          }}
        >
          Question {currentIndex + 1} / {questions.length}
        </p>
        <div
          aria-hidden
          style={{
            height: 4,
            borderRadius: 999,
            background: "var(--color-accent-100)",
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "var(--color-accent)",
              transition: "width 0.25s ease",
            }}
          />
        </div>

        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: "18px 0 0" }}>
          {question.question}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(i)}
                className="text-left"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? "var(--color-accent)" : "var(--color-divider)"}`,
                  background: isSelected ? "var(--color-accent-100)" : "var(--color-surface)",
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={selected === null}
          className="btn btn-primary mt-5"
          style={{ whiteSpace: "nowrap" }}
        >
          {currentIndex + 1 < questions.length ? "Question suivante" : "Voir mon score"}
        </button>
      </div>
    );
  }

  if (phase === "results") {
    const correctCount = questions.reduce(
      (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
      0,
    );
    const score = Math.round((correctCount / questions.length) * 100);
    const wrongOnes = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => answers[i] !== q.correctIndex);

    return (
      <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              borderRadius: "50%",
              flexShrink: 0,
              background: `conic-gradient(var(--color-accent) 0% ${score}%, var(--color-accent-100) ${score}% 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-heading)",
                fontSize: 17,
              }}
            >
              {score}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: 0 }}>
              {correctCount}/{questions.length} bonnes réponses
            </p>
            <p
              style={{
                fontSize: 13,
                margin: "4px 0 0",
                color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
              }}
            >
              Entretien {level} · {job}
            </p>
          </div>
        </div>

        {wrongOnes.length === 0 ? (
          <p style={{ fontSize: 13.5, marginTop: 18 }}>
            Score parfait, aucune question ratée. 🎉
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
              Pourquoi tu n&apos;as pas 100 — et comment t&apos;améliorer :
            </p>
            {wrongOnes.map(({ q, i }) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--color-accent-2-100)",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--color-accent-2-800)" }}>
                  {q.question}
                </p>
                <p style={{ fontSize: 12.5, margin: "6px 0 0", color: "var(--color-accent-2-800)" }}>
                  ✅ Bonne réponse : {q.options[q.correctIndex]}
                </p>
                <p style={{ fontSize: 12.5, margin: "4px 0 0", color: "var(--color-accent-2-800)", opacity: 0.85 }}>
                  {q.explanation}
                </p>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={restart} className="btn btn-secondary mt-5" style={{ whiteSpace: "nowrap" }}>
          Recommencer un entretien
        </button>
      </div>
    );
  }

  // phase === "setup"
  return (
    <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>
        🎤 Simulateur d&apos;entretien
      </p>
      <p
        style={{
          fontSize: 13,
          margin: "6px 0 0",
          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
        }}
      >
        Choisis un niveau et un métier, réponds au quiz, et découvre ton score avec des
        explications pour progresser.
      </p>

      <div className="mt-4">
        <label style={{ fontSize: 12, fontWeight: 600 }}>Métier ciblé</label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="ex : Développeur web"
            className="flex-1"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-divider)",
              fontSize: 13.5,
            }}
          />
          <button
            type="button"
            onClick={() =>
              setJob(RANDOM_JOB_POOL[Math.floor(Math.random() * RANDOM_JOB_POOL.length)])
            }
            className="btn btn-secondary"
            style={{ whiteSpace: "nowrap" }}
            title="Métier aléatoire"
          >
            🎲
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label style={{ fontSize: 12, fontWeight: 600 }}>Niveau</label>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              style={{
                padding: "10px 8px",
                borderRadius: 10,
                border: `1.5px solid ${level === l.value ? "var(--color-accent)" : "var(--color-divider)"}`,
                background: level === l.value ? "var(--color-accent-100)" : "var(--color-surface)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {l.label}
              <br />
              <span style={{ fontWeight: 400, fontSize: 10.5, opacity: 0.75 }}>{l.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12.5, marginTop: 12, color: "var(--color-accent-700)" }}>{error}</p>
      )}

      <button
        type="button"
        onClick={startQuiz}
        disabled={!level || !job.trim() || loading}
        className="btn btn-primary mt-5"
        style={{ whiteSpace: "nowrap" }}
      >
        {loading ? "Génération en cours..." : "Démarrer l'entretien"}
      </button>
    </div>
  );
}
