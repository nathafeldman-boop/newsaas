"use client";

import { useEffect } from "react";

// Filet de sécurité pour tout le groupe (app) : sans ça, une erreur serveur
// sur une page (Supabase lent/indisponible, etc.) laissait un écran blanc
// qu'il fallait recharger à la main pour en sortir.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AppError boundary", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <span aria-hidden style={{ fontSize: 32 }}>
        😕
      </span>
      <h1 style={{ fontSize: 20, margin: 0 }}>Un souci est survenu</h1>
      <p style={{ maxWidth: "34ch", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
        Réessaie — si ça persiste, reviens dans quelques instants.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Réessayer
      </button>
    </div>
  );
}
