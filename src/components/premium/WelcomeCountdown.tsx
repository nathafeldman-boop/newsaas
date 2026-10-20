"use client";

import { useEffect, useState } from "react";
import { PLAN_PRICES } from "@/lib/pricing/plans";

// Compte à rebours du prix de bienvenue (voir lib/pricing/plans.ts). La
// fin est fixée côté serveur : recharger la page ne rajoute pas de temps.
// Avant le montage, pas de secondes affichées (même rendu serveur/client).
export function useWelcomeCountdown(endsAt: number | null, initialActive: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt]);

  if (!endsAt) return { active: false, remaining: null as string | null };
  if (now === null) return { active: initialActive, remaining: null as string | null };
  const ms = endsAt - now;
  if (ms <= 0) return { active: false, remaining: null as string | null };
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { active: true, remaining: `${minutes}:${String(seconds).padStart(2, "0")}` };
}

// Gros chrono en haut du paywall (20/10, Nathan : « nettement plus gros,
// beaucoup plus visible »). Passe au rouge dans les 5 dernières minutes.
export function WelcomePriceBanner({ endsAt, initialActive }: { endsAt: number | null; initialActive: boolean }) {
  const { active, remaining } = useWelcomeCountdown(endsAt, initialActive);
  if (!active) return null;
  const lastMinutes = remaining !== null && Number(remaining.split(":")[0]) < 5;
  return (
    <div
      className="animate-in"
      role="timer"
      aria-live="off"
      style={{
        textAlign: "center",
        color: "#fff",
        borderRadius: 20,
        padding: "14px 16px 13px",
        marginBottom: 16,
        background: lastMinutes
          ? "linear-gradient(135deg, #e5484d, #c2262b)"
          : "linear-gradient(135deg, var(--color-accent-700), var(--color-accent))",
        boxShadow: `0 12px 28px color-mix(in srgb, ${lastMinutes ? "#e5484d" : "var(--color-accent)"} 35%, transparent)`,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.95 }}>
        🎁 Ton prix de bienvenue expire dans
      </p>
      <p
        style={{
          margin: "6px 0 4px",
          fontFamily: "var(--font-heading)",
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {remaining ?? "––:––"}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, opacity: 0.95 }}>
        Ensuite : {PLAN_PRICES.monthly.regular}/mois · {PLAN_PRICES.lifetime.regular} à vie
      </p>
    </div>
  );
}
