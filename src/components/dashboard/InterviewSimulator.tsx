"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PRODUCT_EVENTS, logProductEvent } from "@/lib/analytics/logProductEvent";
import { INTERVIEW_DOMAINS, QUESTION_COUNT_BY_LEVEL, type InterviewLevel, type InterviewQuestion } from "@/lib/interview/questionBank";
import { getInterviewResultMessage } from "@/lib/interview/resultMessages";
import { LEVEL_LABELS, LEVEL_ORDER, MASTERY_SCORE, buildQuiz, nextLevel, progressFor, shuffledQuestions, type QuizResult } from "@/lib/interview/session";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { PREMIUM_PRICE_LINE } from "@/lib/pricing/plans";

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

// Refait le 24/10 (mission churn) : réponses mélangées à chaque partie
// (la bonne était en 2e position 9 fois sur 10), correction complète,
// « refaire mes erreurs », niveau suivant, progression par domaine
// (parties terminées, lues côté serveur) et reprise d'une partie
// interrompue (gardée dans ce navigateur).

type Phase = "setup" | "quiz" | "results";
type Mode = "full" | "review";
type Saved = { domainId: string; level: InterviewLevel; mode: Mode; questions: InterviewQuestion[]; answers: (number | null)[]; index: number; savedAt: number };

const RESUME_MS = 48 * 3600_000;
const storageKey = (userId: string) => `stageio-interview-v1-${userId}`;

function readSaved(userId: string): Saved | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!saved.questions?.length || Date.now() - saved.savedAt > RESUME_MS) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSaved(userId: string, saved: Omit<Saved, "savedAt"> | null) {
  try {
    if (saved) window.localStorage.setItem(storageKey(userId), JSON.stringify({ ...saved, savedAt: Date.now() }));
    else window.localStorage.removeItem(storageKey(userId));
  } catch {
    // navigation privée ou stockage plein : la partie continue, sans reprise possible
  }
}

const darkCard = {
  padding: "var(--space-6)",
  borderRadius: "calc(var(--radius-lg) * 1.15)",
  background: "var(--color-text)",
  color: "var(--color-bg)",
} as const;
const subtle = "var(--color-neutral-300)";

export function InterviewSimulator({
  userId,
  isPremium,
  defaultJobHint,
  defaultDomainId = null,
  pastResults = [],
}: {
  userId: string;
  isPremium: boolean;
  defaultJobHint: string;
  /** Domaine déjà trouvé côté serveur par la taxonomie des métiers (lib/interview/domainForJob). */
  defaultDomainId?: string | null;
  /** Parties terminées (complètes) de l'étudiant, les plus récentes en dernier. */
  pastResults?: QuizResult[];
}) {
  const [domainId, setDomainId] = useState(() => defaultDomainId ?? findClosestDomain(defaultJobHint));
  const [level, setLevel] = useState<InterviewLevel | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("full");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [results, setResults] = useState<QuizResult[]>(pastResults);
  const [resumable, setResumable] = useState<Saved | null>(null);

  // Partie interrompue : lue après le premier rendu (le stockage du
  // navigateur n'existe pas côté serveur).
  useEffect(() => {
    if (!isPremium) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumable(readSaved(userId));
  }, [isPremium, userId]);

  const progress = useMemo(() => progressFor(results, domainId), [results, domainId]);

  if (!isPremium) {
    return (
      <div className="elev-sm" style={{ ...darkCard, textAlign: "center" }}>
        <p style={{ fontSize: 32, margin: 0 }}>🎤</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: "10px 0 0" }}>Simulateur d&apos;entretien</p>
        <p style={{ fontSize: 13, margin: "6px 0 0", color: subtle }}>
          Entraîne-toi avec un entretien à choix multiples adapté à ton domaine, sur 3 niveaux de difficulté, avec la correction détaillée et
          ta progression.
        </p>
        <PremiumCtaLink userId={userId} source="interview_simulator" className="btn btn-primary mt-4" style={{ whiteSpace: "nowrap" }}>
          🔓 Débloquer avec Premium ({PREMIUM_PRICE_LINE})
        </PremiumCtaLink>
      </div>
    );
  }

  function begin(nextDomain: string, nextLevelValue: InterviewLevel, nextMode: Mode, quiz: InterviewQuestion[]) {
    setDomainId(nextDomain);
    setLevel(nextLevelValue);
    setMode(nextMode);
    setQuestions(quiz);
    setAnswers(new Array(quiz.length).fill(null));
    setCurrentIndex(0);
    setPhase("quiz");
    setResumable(null);
    writeSaved(userId, { domainId: nextDomain, level: nextLevelValue, mode: nextMode, questions: quiz, answers: new Array(quiz.length).fill(null), index: 0 });
    void logProductEvent(userId, PRODUCT_EVENTS.interviewQuizStarted, { domain: nextDomain, level: nextLevelValue, mode: nextMode });
  }

  function startQuiz(targetLevel: InterviewLevel | null = level) {
    if (!targetLevel) return;
    begin(domainId, targetLevel, "full", buildQuiz(domainId, targetLevel, Math.floor(Math.random() * 2 ** 31)));
  }

  function reviewMistakes() {
    if (!level) return;
    const wrong = questions.filter((q, i) => answers[i] !== q.correctIndex);
    if (wrong.length === 0) return;
    begin(domainId, level, "review", shuffledQuestions(wrong, Math.floor(Math.random() * 2 ** 31)));
  }

  function resume(saved: Saved) {
    setDomainId(saved.domainId);
    setLevel(saved.level);
    setMode(saved.mode);
    setQuestions(saved.questions);
    setAnswers(saved.answers);
    setCurrentIndex(saved.index);
    setPhase("quiz");
    setResumable(null);
  }

  function selectAnswer(optionIndex: number) {
    const next = [...answers];
    next[currentIndex] = optionIndex;
    setAnswers(next);
    if (level) writeSaved(userId, { domainId, level, mode, questions, answers: next, index: currentIndex });
  }

  function goNext() {
    if (!level) return;
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      writeSaved(userId, { domainId, level, mode, questions, answers, index: currentIndex + 1 });
      return;
    }
    writeSaved(userId, null);
    setAttemptCount((c) => c + 1);
    setPhase("results");
    const correct = questions.reduce((acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc), 0);
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    // Les révisions (erreurs seules) ne comptent pas dans la progression.
    if (mode === "full") setResults((prev) => [...prev, { domain: domainId, level, score, at: new Date().toISOString() }]);
    void logProductEvent(userId, PRODUCT_EVENTS.interviewQuizCompleted, { domain: domainId, level, questions: questions.length, score, mode });
  }

  function backToSetup() {
    writeSaved(userId, null);
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
  }

  if (phase === "quiz") {
    const question = questions[currentIndex];
    const selected = answers[currentIndex];
    return (
      <div className="elev-sm" style={darkCard}>
        <div className="flex items-center justify-between gap-3">
          <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: subtle, margin: 0 }}>
            {mode === "review" ? "Révision · " : ""}Question {currentIndex + 1} / {questions.length}
          </p>
          <button type="button" onClick={backToSetup} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: subtle }}>
            Arrêter
          </button>
        </div>
        <div aria-hidden style={{ height: 4, borderRadius: 999, background: "var(--color-neutral-900)", marginTop: 8, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: "var(--color-accent-400)",
              transition: "width 0.25s ease",
            }}
          />
        </div>

        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: "18px 0 0" }}>{question.question}</p>

        <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Réponses">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => selectAnswer(i)}
                className="text-left"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? "var(--color-accent-400)" : "var(--color-neutral-800)"}`,
                  background: isSelected ? "var(--color-accent-800)" : "var(--color-neutral-900)",
                  color: "var(--color-bg)",
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={goNext} disabled={selected === null} className="btn btn-primary mt-5" style={{ whiteSpace: "nowrap" }}>
          {currentIndex + 1 < questions.length ? "Question suivante" : "Voir la correction"}
        </button>
        <p style={{ fontSize: 11.5, margin: "8px 0 0", color: subtle }}>Ta partie est gardée : tu peux la reprendre plus tard sur cet appareil.</p>
      </div>
    );
  }

  if (phase === "results" && level) {
    const correctCount = questions.reduce((acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc), 0);
    const score = Math.round((correctCount / questions.length) * 100);
    const reviewed = questions.map((q, i) => ({ q, i, ok: answers[i] === q.correctIndex })).sort((a, b) => Number(a.ok) - Number(b.ok));
    const wrongCount = questions.length - correctCount;
    const domainLabel = INTERVIEW_DOMAINS.find((d) => d.id === domainId)?.label ?? domainId;
    const resultMessage = getInterviewResultMessage(score, attemptCount, `${domainId}::${level}`);
    const higher = nextLevel(level);
    const best = progress[level]?.best ?? null;

    return (
      <div className="elev-sm" style={darkCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              borderRadius: "50%",
              flexShrink: 0,
              background: `conic-gradient(var(--color-accent-400) 0% ${score}%, var(--color-neutral-900) ${score}% 100%)`,
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
                background: "var(--color-text)",
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
            <p style={{ fontSize: 13, margin: "4px 0 0", color: subtle }}>
              {mode === "review" ? "Révision de tes erreurs" : `Entretien ${LEVEL_LABELS[level].toLowerCase()}`} · {domainLabel}
              {mode === "full" && best !== null && ` · meilleur : ${best} %`}
            </p>
          </div>
        </div>

        <p style={{ fontSize: 13.5, marginTop: 18, color: "var(--color-accent-200)", fontWeight: 600 }}>{resultMessage}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {wrongCount > 0 && (
            <button type="button" onClick={reviewMistakes} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Refaire mes {wrongCount} erreur{wrongCount > 1 ? "s" : ""}
            </button>
          )}
          {mode === "full" && score >= MASTERY_SCORE && higher && (
            <button type="button" onClick={() => startQuiz(higher)} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Passer au niveau {LEVEL_LABELS[higher].toLowerCase()}
            </button>
          )}
          <button type="button" onClick={() => startQuiz(level)} className="btn btn-secondary" style={{ whiteSpace: "nowrap", color: "var(--color-bg)", borderColor: "var(--color-neutral-800)" }}>
            Rejouer ce niveau
          </button>
          <button type="button" onClick={backToSetup} className="btn btn-ghost" style={{ color: "var(--color-accent-200)" }}>
            Changer de domaine
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: subtle, margin: 0 }}>Correction</p>
          {reviewed.map(({ q, i, ok }) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: "var(--color-neutral-900)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--color-bg)" }}>
                {ok ? "✅" : "❌"} {q.question}
              </p>
              {!ok && answers[i] !== null && (
                <p style={{ fontSize: 12.5, margin: "6px 0 0", color: subtle }}>Ta réponse : {q.options[answers[i]!]}</p>
              )}
              <p style={{ fontSize: 12.5, margin: "6px 0 0", color: "var(--color-accent-200)" }}>
                {ok ? "Ta réponse" : "Bonne réponse"} : {q.options[q.correctIndex]}
              </p>
              <p style={{ fontSize: 12.5, margin: "4px 0 0", color: subtle, opacity: 0.85 }}>{q.explanation}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, margin: "16px 0 0", color: subtle }}>
          Pour aller plus loin :{" "}
          <Link href="/guides/se-presenter-en-entretien" style={{ color: "var(--color-accent-200)" }}>
            se présenter en entretien
          </Link>{" "}
          ·{" "}
          <Link href="/guides/questions-a-poser-en-entretien" style={{ color: "var(--color-accent-200)" }}>
            les questions à poser au recruteur
          </Link>
        </p>
      </div>
    );
  }

  // phase === "setup"
  const resumeLabel = resumable ? INTERVIEW_DOMAINS.find((d) => d.id === resumable.domainId)?.label ?? resumable.domainId : "";
  return (
    <div className="elev-sm" style={darkCard}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🎤 Simulateur d&apos;entretien</p>
      <p style={{ fontSize: 13, margin: "6px 0 0", color: subtle }}>
        Choisis un domaine et un niveau, réponds aux questions d&apos;un recruteur, puis lis la correction pour progresser.
      </p>

      {resumable && (
        <div className="mt-4 flex flex-wrap items-center gap-2" style={{ padding: "10px 12px", borderRadius: 12, background: "var(--color-neutral-900)" }}>
          <span style={{ fontSize: 13, flex: "1 1 200px" }}>
            Entretien en cours : {resumeLabel} · {LEVEL_LABELS[resumable.level].toLowerCase()}, question {resumable.index + 1}/{resumable.questions.length}
          </span>
          <button type="button" onClick={() => resume(resumable)} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12.5 }}>
            Reprendre
          </button>
          <button
            type="button"
            onClick={() => {
              writeSaved(userId, null);
              setResumable(null);
            }}
            className="btn btn-ghost"
            style={{ fontSize: 12.5, color: subtle }}
          >
            Abandonner
          </button>
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="interview-domain" style={{ fontSize: 12, fontWeight: 600 }}>
          Domaine
        </label>
        <select
          id="interview-domain"
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className="mt-1.5 w-full"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-neutral-800)",
            fontSize: 13.5,
            background: "var(--color-neutral-900)",
            color: "var(--color-bg)",
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
        <span style={{ fontSize: 12, fontWeight: 600 }}>Niveau</span>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {LEVEL_ORDER.map((l) => {
            const p = progress[l];
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                aria-pressed={level === l}
                style={{
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: `1.5px solid ${level === l ? "var(--color-accent-400)" : "var(--color-neutral-800)"}`,
                  background: level === l ? "var(--color-accent-800)" : "var(--color-neutral-900)",
                  color: "var(--color-bg)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {LEVEL_LABELS[l]}
                {p && p.best >= MASTERY_SCORE ? " ✓" : ""}
                <br />
                <span style={{ fontWeight: 400, fontSize: 10.5, opacity: 0.75 }}>
                  {p ? `meilleur ${p.best} % · ${p.runs} partie${p.runs > 1 ? "s" : ""}` : `${QUESTION_COUNT_BY_LEVEL[l]} questions`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => startQuiz()} disabled={!level} className="btn btn-primary mt-5" style={{ whiteSpace: "nowrap" }}>
        Démarrer l&apos;entretien
      </button>
    </div>
  );
}
