"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PLAN_PRICES, WELCOME_WINDOW_MS } from "@/lib/pricing/plans";

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

  if (!endsAt) return { active: false, remaining: null as string | null, msLeft: null as number | null };
  if (now === null) return { active: initialActive, remaining: null as string | null, msLeft: null as number | null };
  const ms = endsAt - now;
  if (ms <= 0) return { active: false, remaining: null as string | null, msLeft: null as number | null };
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { active: true, remaining: `${minutes}:${String(seconds).padStart(2, "0")}`, msLeft: ms };
}

// Chiffre du chrono dans sa tuile : glisse à chaque changement.
function DigitTile({ char }: { char: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 46,
        height: 60,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "inset 0 -10px 18px rgba(0,0,0,0.12)",
      }}
    >
      <motion.span
        key={char}
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ fontFamily: "var(--font-heading)", fontSize: 38, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
      >
        {char}
      </motion.span>
      <span aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,0.12)" }} />
    </span>
  );
}

// Gros chrono en haut du paywall (20/10, Nathan : « nettement plus gros,
// beaucoup plus visible » ; 22/10 : 10 min et plus stylé). Tuiles de
// chiffres, barre qui se vide, rouge dans les 2 dernières minutes.
export function WelcomePriceBanner({ endsAt, initialActive }: { endsAt: number | null; initialActive: boolean }) {
  const { active, remaining, msLeft } = useWelcomeCountdown(endsAt, initialActive);
  if (!active) return null;
  const lastMinutes = msLeft !== null && msLeft < 2 * 60_000;
  const [mm, ss] = remaining ? remaining.split(":").map((part) => part.padStart(2, "0")) : ["––", "––"];
  const progress = msLeft !== null ? Math.max(0, Math.min(1, msLeft / WELCOME_WINDOW_MS)) : 1;
  return (
    <motion.div
      className="animate-in"
      role="timer"
      aria-live="off"
      aria-label={`Prix de bienvenue : encore ${mm} min ${ss} s`}
      animate={lastMinutes ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={lastMinutes ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        color: "#fff",
        borderRadius: 22,
        padding: "14px 16px 15px",
        marginBottom: 16,
        background: lastMinutes
          ? "linear-gradient(135deg, #8f1d21, #e5484d)"
          : "linear-gradient(135deg, var(--color-accent-900), var(--color-accent-700) 55%, var(--color-accent))",
        boxShadow: `0 14px 32px color-mix(in srgb, ${lastMinutes ? "#e5484d" : "var(--color-accent)"} 38%, transparent)`,
      }}
    >
      <motion.span
        aria-hidden
        initial={{ x: "-120%" }}
        animate={{ x: "320%" }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "35%",
          background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.16), transparent)",
          pointerEvents: "none",
        }}
      />
      <p style={{ position: "relative", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: "50%", background: lastMinutes ? "#fff" : "var(--color-accent-300)" }}
        />
        {lastMinutes ? "⚡ Dernières minutes" : "🎁 Ton prix de bienvenue expire dans"}
      </p>
      <div aria-hidden style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
        <DigitTile char={mm[0]} />
        <DigitTile char={mm[1]} />
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 800, margin: "0 2px" }}
        >
          :
        </motion.span>
        <DigitTile char={ss[0]} />
        <DigitTile char={ss[1]} />
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.2)", margin: "12px 6px 0", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 999,
            background: lastMinutes ? "#fff" : "linear-gradient(90deg, var(--color-accent-300), #fff)",
            transition: "width 1s linear",
          }}
        />
      </div>
      <p style={{ position: "relative", margin: "10px 0 0", fontSize: 13, fontWeight: 600, opacity: 0.95 }}>
        Ensuite : {PLAN_PRICES.monthly.regular}/mois · {PLAN_PRICES.lifetime.regular} à vie
      </p>
    </motion.div>
  );
}
