"use client";

import { motion } from "framer-motion";

// Fondu + léger slide-up au scroll (ou au montage si déjà visible, ex:
// dans l'onboarding) -- `once: true` pour ne jamais rejouer en scrollant
// de haut en bas puis en remontant.
export function Reveal({
  children,
  delay = 0,
  y = 18,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
