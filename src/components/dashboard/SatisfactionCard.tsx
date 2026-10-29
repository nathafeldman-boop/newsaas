"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { dismissSatisfactionAction, submitSatisfactionAction, type SatisfactionState } from "@/app/(app)/dashboard/satisfaction-actions";
import { SCORE_LABELS, UNHAPPY_MAX_SCORE, type SurveyMoment } from "@/lib/satisfaction/survey";

// « Stageio t'aide dans ta recherche ? » (29/10) : une note de 1 à 5, puis un
// commentaire libre. Note basse : Nathan est prévenu et répond lui-même.

const FACES: Record<number, string> = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "🤩" };
const muted = "color-mix(in srgb, var(--color-text) 64%, transparent)";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 10, height: 42, padding: "0 18px" }}>
      {pending ? "Envoi…" : "Envoyer"}
    </button>
  );
}

export function SatisfactionCard({ moment }: { moment: SurveyMoment }) {
  const [state, formAction] = useActionState<SatisfactionState, FormData>(submitSatisfactionAction, { done: false, score: null, error: null });
  const [score, setScore] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  if (state.done) {
    const s = state.score ?? 0;
    return (
      <section className="card elev-sm animate-in" role="status" style={{ marginTop: 16, padding: "16px 18px" }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          {s <= UNHAPPY_MAX_SCORE ? "Merci de me le dire." : s === 3 ? "Merci, je lis tout." : "Merci, ça fait plaisir !"}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: muted }}>
          {s <= UNHAPPY_MAX_SCORE
            ? "Je regarde ton compte et je te réponds par e-mail. Tu peux aussi m'écrire à contact@stageio.fr."
            : s === 3
              ? "Si quelque chose te bloque, écris-moi à contact@stageio.fr : je réponds moi-même."
              : "On améliore Stageio chaque jour pour que tu trouves vite. Bonne recherche !"}
        </p>
      </section>
    );
  }

  return (
    <section className="card elev-sm animate-in" style={{ marginTop: 16, padding: "16px 18px" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>Stageio t&apos;aide dans ta recherche ?</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: muted }}>5 secondes. Je lis chaque réponse moi-même. Nathan</p>
        </div>
        <form
          action={async () => {
            setHidden(true);
            await dismissSatisfactionAction();
          }}
        >
          <button type="submit" style={{ border: "none", background: "transparent", color: muted, fontSize: 12.5, cursor: "pointer", padding: 4, whiteSpace: "nowrap" }}>
            Plus tard
          </button>
        </form>
      </div>
      <form action={formAction}>
        <input type="hidden" name="moment" value={moment} />
        <div role="radiogroup" aria-label="Ta note" className="grid grid-cols-5 gap-1.5" style={{ marginTop: 12 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <label
              key={s}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 2px",
                borderRadius: 12,
                cursor: "pointer",
                border: score === s ? "2px solid var(--color-accent)" : "1.5px solid var(--color-divider)",
                background: score === s ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))" : "var(--color-surface)",
              }}
            >
              <input type="radio" name="score" value={s} checked={score === s} onChange={() => setScore(s)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
              <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>
                {FACES[s]}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, textAlign: "center", color: muted }}>{SCORE_LABELS[s]}</span>
            </label>
          ))}
        </div>
        {score !== null && (
          <div className="animate-in">
            <textarea
              name="comment"
              maxLength={1000}
              rows={3}
              placeholder={score <= 3 ? "Qu'est-ce qui coince ? (offres, envoi des candidatures, un bug…)" : "Qu'est-ce qui t'aide le plus ? (facultatif)"}
              className="input"
              style={{ width: "100%", marginTop: 10, fontSize: 14, lineHeight: 1.45, resize: "vertical" }}
            />
            {state.error && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#b42318" }}>{state.error}</p>}
            <SendButton />
          </div>
        )}
      </form>
    </section>
  );
}
