"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FAVORITE_LANDED } from "@/lib/fx/events";

// Pastille de l'onglet Favoris : nombre d'offres likées pas encore
// candidatées (calculé par le layout au chargement) + les likes faits depuis,
// en direct. À chaque cœur qui arrive (voir FavoriteFlight) : l'onglet bat,
// un halo s'allume, la pastille rebondit, une onde part et un « +1 »
// s'envole. `children` : l'icône (barre du bas) ou le libellé (menu du haut).

export function FavoritesTabIcon({ baseCount, children }: { baseCount: number; children: React.ReactNode }) {
  // Nouveau décompte serveur (rafraîchissement de la page) : les likes faits
  // entre-temps y sont déjà comptés.
  const [base, setBase] = useState(baseCount);
  const [added, setAdded] = useState(0);
  const [pulse, setPulse] = useState(0);
  if (base !== baseCount) {
    setBase(baseCount);
    setAdded(0);
  }

  useEffect(() => {
    function onLanded() {
      setAdded((n) => n + 1);
      setPulse((n) => n + 1);
    }
    window.addEventListener(FAVORITE_LANDED, onLanded);
    return () => window.removeEventListener(FAVORITE_LANDED, onLanded);
  }, []);

  const count = baseCount + added;

  return (
    <span data-fav-target style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {/* Halo derrière l'icône */}
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={`glow-${pulse}`}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 45%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <motion.span
        key={`beat-${pulse}`}
        initial={false}
        animate={pulse ? { scale: [1, 1.55, 0.86, 1.2, 1], rotate: [0, -10, 8, -4, 0] } : { scale: 1 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        style={{ position: "relative", display: "inline-flex", color: pulse ? "var(--color-accent-700)" : undefined }}
      >
        {children}
      </motion.span>

      {/* Onde qui part de la pastille */}
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={`ring-${pulse}`}
            initial={{ scale: 0.5, opacity: 0.9 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: -9,
              right: -13,
              width: 20,
              height: 20,
              borderRadius: 999,
              border: "2px solid var(--color-accent)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* « +1 » qui s'envole */}
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={`plus-${pulse}`}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -30, opacity: [0, 1, 1, 0], scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: -14,
              right: -16,
              fontSize: 13,
              fontWeight: 900,
              color: "var(--color-accent-700)",
              fontFamily: "var(--font-heading)",
              pointerEvents: "none",
              textShadow: "0 1px 0 var(--color-surface)",
              whiteSpace: "nowrap",
            }}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={`badge-${pulse}`}
            aria-hidden
            initial={pulse ? { scale: 0.2, rotate: -30 } : false}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 640, damping: 12 }}
            style={{
              position: "absolute",
              top: -7,
              right: -11,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              boxSizing: "border-box",
              borderRadius: 999,
              background: "linear-gradient(135deg, #3ee08f, var(--color-accent))",
              color: "#fff",
              fontSize: 9.5,
              fontWeight: 800,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--color-surface)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-heading)",
            }}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
