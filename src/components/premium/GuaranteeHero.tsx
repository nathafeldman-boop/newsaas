"use client";

import { motion } from "framer-motion";
import { GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";

// Carte « Remboursé » de la garantie : la même avant le paywall (3e écran)
// et dans le message en quittant le paywall.
export function GuaranteeHero({ marginTop = 22 }: { marginTop?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.92, rotate: -2 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 14 }}
      style={{
        position: "relative",
        marginTop,
        width: "100%",
        borderRadius: 28,
        padding: "30px 22px 26px",
        background: "linear-gradient(140deg, var(--color-accent), var(--color-accent-2))",
        color: "var(--color-bg)",
        boxShadow: "0 18px 40px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <svg aria-hidden width="220" height="220" viewBox="0 0 24 24" style={{ position: "absolute", right: -50, top: -40, opacity: 0.12 }}>
        <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" fill="currentColor" />
      </svg>
      <svg aria-hidden width="92" height="92" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto", display: "block" }}>
        <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" fill="currentColor" fillOpacity="0.95" />
        <path d="M8.2 12.2l2.6 2.6 5-5.4" stroke="var(--color-accent-700)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 800, lineHeight: 1.05, margin: "14px 0 0" }}>
        Remboursé
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, margin: "10px 0 0" }}>
        Pas d&apos;entretien au bout de {GUARANTEE_MONTHS} mois de Premium ? On te rembourse.
      </p>
      <span
        style={{
          display: "inline-block",
          marginTop: 14,
          padding: "6px 14px",
          borderRadius: 999,
          background: "color-mix(in srgb, var(--color-bg) 22%, transparent)",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        Sur toutes les formules
      </span>
    </motion.div>
  );
}
