"use client";

import { useState } from "react";
import {
  INTERVIEW_DOMAINS,
  QUESTION_COUNT_BY_LEVEL,
  getInterviewQuestions,
  type InterviewLevel,
  type InterviewQuestion,
} from "@/lib/interview/questionBank";
import { getInterviewResultMessage } from "@/lib/interview/resultMessages";

const LEVELS: { value: InterviewLevel; label: string; hint: string }[] = [
  { value: "facile", label: "Facile", hint: `${QUESTION_COUNT_BY_LEVEL.facile} questions` },
  { value: "medium", label: "Médium", hint: `${QUESTION_COUNT_BY_LEVEL.medium} questions` },
  { value: "difficile", label: "Difficile", hint: `${QUESTION_COUNT_BY_LEVEL.difficile} questions` },
];

// Trouve le domaine le plus proche du métier/secteur visé du profil (simple
// correspondance sous-chaîne, insensible à la casse) -- à défaut, premier
// domaine de la liste. Banque de questions statique, écrite à la main
// (voir src/lib/interview/questionBank.ts) : zéro dépendance IA/API pour
// cette fonctionnalité, donc zéro risque de panne externe.
function findClosestDomain(hint: string): string {
  const lower = hint.toLowerCase();
  const match = INTERVIEW_DOMAINS.find(
    (d) => lower.includes(d.id) || d.label.toLowerCase().includes(lower) || lower.includes(d.label.toLowerCase()),
  );
  return match?.id ?? INTERVIEW_DOMAINS[0].id;
}

type Phase = "setup" | "quiz" | "results";

export function InterviewSimulator({
  isPremium,
  defaultJobHint,
}: {
  isPremium: boolean;
  defaultJobHint: string;
}) {
  const [domainId, setDomainId] = useState(() => findClosestDomain(defaultJobHint));
  const [level, setLevel] = useState<InterviewLevel | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);

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
          Entraîne-toi avec un entretien à choix multiples adapté à ton domaine, sur 3 niveaux de
          difficulté, avec un score et des explications à la fin.
        </p>
        <a href="/premium" className="btn btn-primary mt-4" style={{ whiteSpace: "nowrap" }}>
          🔓 Débloquer avec Premium (7,99€/mois)
        </a>
      </div>
    );
  }

  function startQuiz() {
    if (!level) return;
    setQuestions(getInterviewQuestions(domainId, level));
    setAnswers(new Array(QUESTION_COUNT_BY_LEVEL[level]).fill(null));
    setCurrentIndex(0);
    setPhase("quiz");
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
      setAttemptCount((c) => c + 1);
      setPhase("results");
    }
  }

  function restart() {
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
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
    const domainLabel = INTERVIEW_DOMAINS.find((d) => d.id === domainId)?.label ?? domainId;
    const resultMessage = getInterviewResultMessage(score, attemptCount, `${domainId}::${level}`);

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
              Entretien {level} · {domainLabel}
            </p>
          </div>
        </div>

        {wrongOnes.length === 0 ? (
          <p style={{ fontSize: 13.5, marginTop: 18 }}>{resultMessage}</p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{resultMessage}</p>
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
        Choisis un domaine et un niveau, réponds au quiz, et découvre ton score avec des
        explications pour progresser.
      </p>

      <div className="mt-4">
        <label style={{ fontSize: 12, fontWeight: 600 }}>Domaine</label>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="mt-1.5 w-full"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-divider)",
            fontSize: 13.5,
            background: "var(--color-surface)",
          }}
        >
          {INTERVIEW_DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
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

      <button
        type="button"
        onClick={startQuiz}
        disabled={!level}
        className="btn btn-primary mt-5"
        style={{ whiteSpace: "nowrap" }}
      >
        Démarrer l&apos;entretien
      </button>
    </div>
  );
}
