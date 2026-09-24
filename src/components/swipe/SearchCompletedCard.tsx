"use client";

import { useTransition } from "react";
import { resumeSearchAction } from "@/app/(app)/profil/search-actions";

// Remplace le deck sur /swipe une fois profiles.search_completed_at
// renseigné (voir search-actions.ts) -- jamais présenté comme un échec,
// et toujours réversible en un clic sans perdre aucune donnée (candidatures,
// favoris, historique restent intacts).
export function SearchCompletedCard({ reason }: { reason: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6 py-16">
      <p style={{ fontSize: 48, margin: 0 }}>🎉</p>
      <h1 style={{ fontSize: 22, marginTop: 16 }}>Bravo pour ton alternance !</h1>
      <p
        style={{
          marginTop: 8,
          maxWidth: "34ch",
          fontSize: 14,
          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
        }}
      >
        {reason
          ? `Recherche clôturée : ${reason}.`
          : "Ta recherche est marquée comme terminée."}{" "}
        Tes candidatures et favoris restent disponibles.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void resumeSearchAction())}
        className="btn btn-secondary mt-6"
      >
        {pending ? "..." : "Reprendre ma recherche"}
      </button>
    </div>
  );
}
