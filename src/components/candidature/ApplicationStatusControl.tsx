"use client";

import { useTransition } from "react";
import { updateApplicationStatusAction } from "@/app/(app)/mes-candidatures/actions";
import type { ApplicationStatus } from "@/types/database";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "Envoyée",
  en_cours: "En cours",
  entretien: "Entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

const OPTIONS: ApplicationStatus[] = ["envoyee", "en_cours", "entretien", "acceptee", "refusee"];

// Sélecteur de statut manuel (voir actions.ts pour pourquoi c'est
// nécessaire) -- un <select> natif plutôt qu'un composant custom : le plus
// rapide à rendre correctement accessible, et cohérent avec le reste de
// l'app qui n'a pas de dépendance UI lourde pour ce genre de contrôle.
export function ApplicationStatusControl({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onClick={(e) => e.preventDefault()}
      onChange={(e) => {
        const next = e.target.value as ApplicationStatus;
        startTransition(() => void updateApplicationStatusAction(applicationId, next));
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
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {STATUS_LABELS[opt]}
        </option>
      ))}
    </select>
  );
}
