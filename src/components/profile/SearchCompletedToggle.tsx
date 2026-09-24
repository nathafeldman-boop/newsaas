"use client";

import { useState, useTransition } from "react";
import { markSearchCompletedAction, resumeSearchAction } from "@/app/(app)/profil/search-actions";

const REASONS = [
  "Alternance trouvée via Stageio",
  "Alternance trouvée ailleurs",
  "Recherche mise en pause",
];

// Point d'entrée pour clôturer la recherche (voir search-actions.ts) --
// volontairement discret sur /profil plutôt qu'une interruption forcée du
// deck, pour ne jamais donner l'impression que Stageio pousse l'utilisateur
// vers la sortie.
export function SearchCompletedToggle({
  completedAt,
  completedReason,
}: {
  completedAt: string | null;
  completedReason: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (completedAt) {
    return (
      <div
        className="card flex-row items-center justify-between"
        style={{ padding: "var(--space-3) var(--space-4)" }}
      >
        <div>
          <span style={{ fontSize: 14 }}>🎉 Recherche clôturée</span>
          {completedReason && (
            <p style={{ fontSize: 12, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              {completedReason}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void resumeSearchAction())}
          className="btn btn-secondary"
          style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }}
        >
          Reprendre
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card flex-row items-center justify-between no-underline"
        style={{ color: "inherit", padding: "var(--space-3) var(--space-4)", width: "100%", border: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
      >
        <span style={{ fontSize: 14 }}>🎉 J&apos;ai trouvé mon alternance</span>
        <span>→</span>
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: "var(--space-4)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Félicitations ! Une précision ?</p>
      <div className="flex flex-col gap-2">
        {REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void markSearchCompletedAction(reason))}
            className="btn btn-secondary"
            style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
          >
            {reason}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ marginTop: 10, background: "none", border: "none", padding: 0, fontSize: 12, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", cursor: "pointer" }}
      >
        Annuler
      </button>
    </div>
  );
}
