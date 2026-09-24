"use client";

import { useState, useTransition } from "react";
import { analyzeOfferFitAction, type OfferFitState } from "@/app/(app)/candidature/[offerId]/cv-match-actions";

// Section 14 de l'audit : "Analyser mon CV pour cette offre" -- distincte de
// l'audit CV général (/profil), qui note le CV dans l'absolu. Repliée par
// défaut (déclenchée au clic) pour ne jamais gonfler le temps de chargement
// de la page candidature avec un appel IA que tout le monde ne demande pas.
export function CvOfferMatchPanel({ offerId }: { offerId: string }) {
  const [state, setState] = useState<OfferFitState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function handleAnalyze() {
    startTransition(async () => {
      const result = await analyzeOfferFitAction(offerId);
      setState(result);
    });
  }

  if (state.status === "idle") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={handleAnalyze}
        className="btn btn-secondary mt-4"
        style={{ width: "100%" }}
      >
        {pending ? "Analyse en cours…" : "🎯 Analyser mon CV pour cette offre"}
      </button>
    );
  }

  if (state.status === "error") {
    return (
      <div className="card mt-4" style={{ padding: "var(--space-4)", fontSize: 13 }}>
        {state.message}
      </div>
    );
  }

  return (
    <div className="card mt-4" style={{ padding: "var(--space-5)" }}>
      <div className="flex items-center justify-between">
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, margin: 0 }}>
          🎯 Correspondance avec cette offre
        </p>
        <span className="tag tag-accent">{state.score}%</span>
      </div>

      {state.matched.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>✓ Ce qui matche</p>
          {state.matched.map((m) => (
            <p key={m} style={{ fontSize: 13, margin: "2px 0", color: "color-mix(in srgb, var(--color-text) 80%, transparent)" }}>
              {m}
            </p>
          ))}
        </div>
      )}

      {state.gaps.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>À vérifier</p>
          {state.gaps.map((g) => (
            <p key={g} style={{ fontSize: 13, margin: "2px 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
              {g}
            </p>
          ))}
        </div>
      )}

      {state.advice.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>💡 Conseil</p>
          {state.advice.map((a) => (
            <p key={a} style={{ fontSize: 13, margin: "2px 0", color: "color-mix(in srgb, var(--color-text) 80%, transparent)" }}>
              {a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
