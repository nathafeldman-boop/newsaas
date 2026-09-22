"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0h 00m 00s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

// Timer client (le compte à rebours doit bouger seconde par seconde, un
// Server Component ne peut pas faire ça) pour la formule quotidienne, dont
// le retrait est planifié -- voir DAILY_OFFER_DEADLINE dans page.tsx, seule
// source de vérité sur la date/heure exacte (ce composant ne fait que
// l'afficher, jamais la recalculer).
export function DailyOfferCountdown({ deadline }: { deadline: string }) {
  const deadlineMs = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemaining(deadlineMs - Date.now());
    }
    // setState reporté à un vrai callback asynchrone (setTimeout/interval),
    // jamais appelé de façon synchrone dans le corps de l'effet lui-même --
    // exigé par la règle "set-state-in-effect" du linter (cascading renders).
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [deadlineMs]);

  // Rien avant l'hydratation (remaining === null) : le rendu serveur ne
  // connaît pas l'heure exacte du navigateur, l'afficher tout de suite
  // causerait un mismatch d'hydratation Next.js.
  if (remaining === null) return null;

  return (
    <div
      className="flex items-center gap-2"
      style={{
        marginTop: 4,
        marginBottom: 10,
        background: "var(--color-accent-2-100)",
        border: "1px solid var(--color-accent-2-300)",
        borderRadius: 10,
        padding: "6px 10px",
      }}
    >
      <span aria-hidden style={{ fontSize: 13 }}>
        ⏳
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent-2-800)" }}>
        {remaining > 0 ? (
          <>Formule bientôt retirée : {formatRemaining(remaining)}</>
        ) : (
          "Cette formule n'est plus disponible."
        )}
      </span>
    </div>
  );
}
