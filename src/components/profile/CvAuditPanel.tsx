"use client";

import { useActionState } from "react";
import { auditCvAction, type CvAuditState } from "@/app/(app)/profil/cv-audit-actions";
import { cn } from "@/lib/utils";

const initialState: CvAuditState = { status: "idle" };

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 border-green-600";
  if (score >= 50) return "text-amber-600 border-amber-600";
  return "text-red-600 border-red-600";
}

export function CvAuditPanel({ hasCv }: { hasCv: boolean }) {
  const [state, formAction, pending] = useActionState(
    auditCvAction,
    initialState,
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-bold">Audit de ton CV</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Mistral analyse ton CV et te donne une note sur 100, avec des pistes
        concrètes pour l&apos;améliorer.
      </p>

      {!hasCv ? (
        <p className="mt-4 text-sm text-foreground/50">
          Ajoute d&apos;abord ton CV ci-dessus pour pouvoir l&apos;analyser.
        </p>
      ) : (
        <form action={formAction} className="mt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Analyse en cours..." : "Analyser mon CV"}
          </button>
        </form>
      )}

      {state.status === "error" && (
        <p className="mt-4 text-sm text-red-600">{state.message}</p>
      )}

      {state.status === "success" && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-lg font-extrabold",
                scoreColor(state.score),
              )}
            >
              {state.score}
            </div>
            <p className="text-sm text-foreground/60">sur 100</p>
          </div>

          {state.strengths.length > 0 && (
            <div>
              <p className="text-sm font-semibold">✅ Points forts</p>
              <ul className="mt-1 space-y-1 text-sm text-foreground/70">
                {state.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {state.improvements.length > 0 && (
            <div>
              <p className="text-sm font-semibold">🔧 À améliorer</p>
              <ul className="mt-1 space-y-1 text-sm text-foreground/70">
                {state.improvements.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {state.missing_sections.length > 0 && (
            <div>
              <p className="text-sm font-semibold">⚠️ Sections manquantes</p>
              <ul className="mt-1 space-y-1 text-sm text-foreground/70">
                {state.missing_sections.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
