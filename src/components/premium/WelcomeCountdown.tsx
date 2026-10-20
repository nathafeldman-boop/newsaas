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

export function WelcomePriceBanner({ endsAt, initialActive }: { endsAt: number | null; initialActive: boolean }) {
  const { active, remaining } = useWelcomeCountdown(endsAt, initialActive);
  if (!active) return null;
  return (
    <div
      className="animate-in flex items-center gap-2"
      style={{
        background: "var(--color-accent-2-100)",
        border: "1px solid var(--color-accent-2-300)",
        borderRadius: 12,
        padding: "9px 12px",
        marginBottom: 14,
      }}
    >
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
        🎁
      </span>
      <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--color-accent-2-800)" }}>
        <strong>
          Ton prix de bienvenue est réservé encore{" "}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{remaining ?? "quelques minutes"}</span>
        </strong>{" "}
        — ensuite {PLAN_PRICES.monthly.regular}/mois et {PLAN_PRICES.lifetime.regular} à vie.
      </div>
    </div>
  );
}
