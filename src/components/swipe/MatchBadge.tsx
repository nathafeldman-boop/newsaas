"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { SparkleBurst } from "@/components/fx/SparkleBurst";
import { prefersReducedMotion } from "@/lib/fx/events";

// Gros badge de match posé à cheval sur la bordure verte de la carte (16/10,
// demande de Nathan : « en haut, au milieu, ultra stylé, un peu animé, la
// première chose que tu dois voir »). Bordure en dégradé qui tourne, halo
// qui pulse, score qui monte de 0 au vrai score, étincelles au-dessus de 85.
// Le score est toujours le vrai (computeMatchPercent) ; `hidden` le floute
// avec un cadenas (compte gratuit, au-delà des 3 premières cartes).

function MatchCount({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, score, {
      duration: prefersReducedMotion() ? 0 : 1.1,
      delay: 0.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);
  return <>{shown}</>;
}

export function MatchBadge({ score, hidden = false }: { score: number; hidden?: boolean }) {
  const hot = !hidden && score >= 85;
  const icon = score >= 90 ? "🔥" : score >= 80 ? "⚡" : "✨";

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0, y: -8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 17, delay: 0.05 }}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {hot && <SparkleBurst count={16} spread={110} />}
      {!hidden && (
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--color-accent) 45%, transparent)",
            filter: "blur(8px)",
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          padding: 2.5,
          borderRadius: 999,
          overflow: "hidden",
          boxShadow: "0 10px 26px color-mix(in srgb, var(--color-accent) 38%, transparent)",
        }}
      >
        <span
          aria-hidden
          className={hidden ? undefined : "fx-spin"}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 220,
            height: 220,
            margin: "-110px 0 0 -110px",
            background: "conic-gradient(from 0deg, var(--color-accent), #ffd84d, var(--color-accent-2), #7fe3ff, var(--color-accent))",
          }}
        />
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            padding: "5px 15px 5px 11px",
            background: "var(--color-neutral-100)",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>
            {hidden ? "🔒" : icon}
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, var(--color-accent-700), var(--color-accent-2))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              ...(hidden ? { filter: "blur(6px)", userSelect: "none" as const } : {}),
            }}
          >
            {hidden ? score : <MatchCount score={score} />}%
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent-700)",
            }}
          >
            match
          </span>
        </span>
      </span>
    </motion.div>
  );
}
