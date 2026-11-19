"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Offer } from "@/types/database";

// Like d'un compte non Premium (19/11, Nathan : « rien de gratuit, mais dès
// qu'ils cliquent, une animation comme si c'était envoyé, et au moment de le
// faire, retour au paywall »). La candidature se prépare sous ses yeux (lettre,
// CV, entreprise), la barre monte, puis s'arrête juste avant l'envoi : on
// l'amène au paywall. Rien n'est envoyé ni enregistré, et le texte ne dit
// jamais « envoyée » : « prête », puis « débloque l'envoi ».

const STEPS = ["Lettre de motivation écrite", "CV joint", "Candidature prête à partir"] as const;
const STEP_MS = 650;

export function LikeSendingOverlay({ offer, onLocked }: { offer: Offer | null; onLocked: (offer: Offer) => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!offer) return;
    const timers = [1, 2, 3].map((i) => window.setTimeout(() => setStep(i), i * STEP_MS));
    const done = window.setTimeout(() => onLocked(offer), 3 * STEP_MS + 900);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [offer, onLocked]);
  if (!offer) return null;
  const locked = step >= 3;
  const company = offer.company?.trim() && !/non communiqu/i.test(offer.company) ? offer.company.trim() : "l'entreprise";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center"
      style={{ position: "absolute", inset: 0, zIndex: 40, borderRadius: 24, background: "color-mix(in srgb, var(--color-bg) 94%, transparent)", backdropFilter: "blur(6px)", padding: 22 }}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: [0.5, 1.2, 1], rotate: 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-bg)", fontSize: 30 }}
      >
        {locked ? "🔒" : "♥"}
      </motion.div>
      <p style={{ margin: "14px 0 0", fontSize: 18, fontWeight: 800, textAlign: "center" }}>
        {locked ? "Plus qu'une étape" : "On prépare ta candidature…"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13.5, textAlign: "center", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", maxWidth: "30ch" }}>
        {offer.title} · {company}
      </p>
      <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
        {STEPS.map((label, i) => {
          const ok = step > i;
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: step >= i ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              <span
                aria-hidden
                className="flex items-center justify-center"
                style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, fontSize: 12, background: ok ? "var(--color-accent)" : "var(--color-divider)", color: "var(--color-bg)" }}
              >
                {ok ? "✓" : ""}
              </span>
              {label}
            </motion.li>
          );
        })}
      </ul>
      <div aria-hidden style={{ width: "100%", maxWidth: 280, height: 8, borderRadius: 999, background: "var(--color-divider)", marginTop: 18, overflow: "hidden" }}>
        <motion.div
          initial={{ width: "4%" }}
          animate={{ width: locked ? "92%" : `${8 + step * 28}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-700))" }}
        />
      </div>
      {locked && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ margin: "14px 0 0", fontSize: 14, fontWeight: 800, color: "var(--color-accent-700)", textAlign: "center" }}>
          Débloque l&apos;envoi avec Premium →
        </motion.p>
      )}
    </motion.div>
  );
}
