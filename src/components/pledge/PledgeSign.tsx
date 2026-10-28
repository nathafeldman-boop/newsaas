"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// Engagement signé à l'empreinte (Nathan, 20/10) : l'étudiant maintient son
// doigt sur l'empreinte, l'anneau se remplit, c'est signé. Geste symbolique :
// aucune donnée biométrique n'est lue, et c'est écrit à l'écran. Avant le
// paywall jusqu'au 28/10 ; depuis, à la fin de l'onboarding, avant le
// premier swipe (Nathan : « au lieu de la mettre au niveau du paywall, tu
// vas la mettre là »).
const HOLD_MS = 1600;
const RING_RADIUS = 58;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function FingerprintIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

export function PledgeSign({ userId, contractLabel, onSigned }: { userId: string; contractLabel: string; onSigned: () => void }) {
  const [progress, setProgress] = useState(0);
  const [signed, setSigned] = useState(false);
  const holdStart = useRef<number | null>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function complete() {
    holdStart.current = null;
    setProgress(1);
    setSigned(true);
    navigator.vibrate?.(60);
    void createClient()
      .from("user_events")
      .insert({ user_id: userId, event_type: "pledge_signed", metadata: { where: "onboarding" } })
      .then(({ error }) => {
        if (error) console.error("pledge_signed event failed", error);
      });
    window.setTimeout(onSigned, 1000);
  }

  function startHold() {
    if (signed || holdStart.current !== null) return;
    navigator.vibrate?.(15);
    holdStart.current = performance.now();
    const tick = (now: number) => {
      if (holdStart.current === null) return;
      const p = Math.min(1, (now - holdStart.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) complete();
      else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    if (holdStart.current === null) return;
    holdStart.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  }

  return (
    <div className="flex w-full flex-col items-center text-center" style={{ maxWidth: 400, margin: "auto" }}>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, color: "var(--color-accent-700)" }}
      >
        Avant de commencer
      </motion.p>
      <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, margin: "6px 0 0" }}>Notre contrat 🤝</h1>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="card"
        style={{ marginTop: 18, padding: "18px 18px", textAlign: "left", fontSize: 14.5, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 12 }}
      >
        <p style={{ margin: 0 }}>
          <strong>Stageio s&apos;engage</strong> à tout faire pour que tu décroches {contractLabel} : de nouvelles offres chaque jour, une
          lettre de motivation pour chaque candidature, ton CV passé au crible.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Toi, tu t&apos;engages à ne rien lâcher</strong> : continuer à postuler, même après un refus. C&apos;est comme ça que tu
          vas y arriver.
        </p>
      </motion.div>

      <button
        type="button"
        aria-label="Maintiens appuyé pour signer ton engagement"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          startHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onLostPointerCapture={cancelHold}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") cancelHold();
        }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={signed}
        style={{
          position: "relative",
          marginTop: 28,
          width: 136,
          height: 136,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: signed ? "default" : "pointer",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 136 136" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx="68" cy="68" r={RING_RADIUS} stroke="var(--color-divider)" strokeWidth="6" fill="none" />
          <circle
            cx="68"
            cy="68"
            r={RING_RADIUS}
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
            style={{ transition: progress === 0 ? "stroke-dashoffset 0.25s ease" : "none" }}
          />
        </svg>
        <motion.span
          animate={signed ? { scale: [1, 1.15, 1] } : { scale: 1 - progress * 0.06 }}
          transition={signed ? { duration: 0.45 } : { duration: 0 }}
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: signed
              ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))"
              : `color-mix(in srgb, var(--color-accent) ${Math.round(10 + progress * 35)}%, var(--color-surface))`,
            color: signed ? "var(--color-bg)" : "var(--color-accent-700)",
            boxShadow: "0 10px 28px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          {signed ? (
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <FingerprintIcon size={58} />
          )}
        </motion.span>
      </button>

      <p style={{ fontSize: 15, fontWeight: 700, margin: "18px 0 0", minHeight: 22 }}>
        {signed ? "C'est signé ✍️" : progress > 0 ? "Garde ton doigt dessus…" : "Maintiens ton doigt sur l'empreinte pour signer"}
      </p>
      <p style={{ fontSize: 11.5, margin: "10px 0 0", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
        Engagement symbolique : il ne te fait rien payer et aucune empreinte n&apos;est enregistrée.
      </p>
    </div>
  );
}
