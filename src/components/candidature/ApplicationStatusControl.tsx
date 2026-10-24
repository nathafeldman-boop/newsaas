"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatusAction } from "@/app/(app)/mes-candidatures/actions";
import { STATUS_HINTS, STATUS_LABELS, STATUS_ORDER } from "@/lib/applications/status";
import type { ApplicationStatus } from "@/types/database";

// Sélecteur de statut manuel (voir actions.ts pour pourquoi c'est
// nécessaire) -- un <select> natif plutôt qu'un composant custom : le plus
// rapide à rendre correctement accessible, et cohérent avec le reste de
// l'app qui n'a pas de dépendance UI lourde pour ce genre de contrôle.
// Le choix s'affiche tout de suite et revient en arrière avec un message si
// l'enregistrement échoue (24/10 : avant, l'échec était muet).
export function ApplicationStatusControl({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(status);
  // Nouveau statut venu du serveur (rafraîchissement après une autre action).
  if (status !== synced) {
    setSynced(status);
    setValue(status);
  }

  return (
    <span className="flex flex-col items-end" style={{ gap: 2 }}>
      <select
        value={value}
        disabled={pending}
        title={STATUS_HINTS[value]}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const next = e.target.value as ApplicationStatus;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await updateApplicationStatusAction(applicationId, next);
            if (!result.ok) {
              setValue(previous);
              setError(result.error);
            }
          });
        }}
        className="tag"
        style={{
          border: "1px solid var(--color-divider)",
          background: "var(--color-surface)",
          fontSize: 11.5,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
        }}
        aria-label="Statut de la candidature"
      >
        {STATUS_ORDER.map((opt) => (
          <option key={opt} value={opt}>
            {STATUS_LABELS[opt]}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" style={{ fontSize: 11, color: "var(--color-accent-700)", maxWidth: 200, textAlign: "right" }}>
          {error}
        </span>
      )}
    </span>
  );
}
