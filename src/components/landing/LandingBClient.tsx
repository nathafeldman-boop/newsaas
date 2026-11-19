"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Parties animées de la page d'accueil B (test A/B du 19/11).

const WORDS = ["CDI", "alternance", "stage", "CDD"] as const;

/** Le mot en vert du titre change toutes les 2,2 s. */
export function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: "inline-block", position: "relative", color: "var(--color-accent)" }}>
      <AnimatePresence mode="wait">
        <motion.span key={WORDS[i]} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28 }} style={{ display: "inline-block" }}>
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const FEATURES = ["Il lit ton profil et ton CV", "Il trie les offres pour toi", "Il écrit ta lettre de motivation", "Il suit tes candidatures"] as const;

/** Les 4 lignes s'allument l'une après l'autre, en boucle. */
export function FeatureCycle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % FEATURES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", textAlign: "center" }}>
      {FEATURES.map((f, k) => (
        <motion.li
          key={f}
          animate={{ color: k === i ? "var(--color-text)" : "color-mix(in srgb, var(--color-text) 28%, transparent)", scale: k === i ? 1.04 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 22, fontWeight: 800, margin: "10px 0", fontFamily: "var(--font-heading)" }}
        >
          {f}
        </motion.li>
      ))}
    </ul>
  );
}

/** Question de FAQ dépliable. */
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3"
        style={{ background: "none", border: 0, padding: 0, textAlign: "left", fontWeight: 800, fontSize: 15, color: "inherit", cursor: "pointer" }}
      >
        {q}
        <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>{a}</p>}
    </div>
  );
}
