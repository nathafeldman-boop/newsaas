"use client";

import { motion } from "framer-motion";

// Effet "coup de stabilo" : un bloc de couleur qui se dessine derrière le
// texte de gauche à droite, comme un vrai surligneur. `whileInView` le
// déclenche au scroll (LP) et tout aussi bien dès le montage si l'élément
// est déjà visible (étapes d'onboarding).
export function Highlight({
  children,
  color = "var(--color-accent-2-200)",
  delay = 0.15,
}: {
  children: React.ReactNode;
  color?: string;
  delay?: number;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: "easeOut", delay }}
        style={{
          position: "absolute",
          left: "-0.12em",
          right: "-0.12em",
          top: "0.28em",
          bottom: "0.02em",
          background: color,
          borderRadius: "2px 9px 4px 10px / 7px 3px 9px 4px",
          transformOrigin: "left center",
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
}
