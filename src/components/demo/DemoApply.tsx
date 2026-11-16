"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONTRACT_LABEL } from "@/lib/offers/contractLabels";
import type { Offer } from "@/types/database";

const muted = "color-mix(in srgb, var(--color-text) 60%, transparent)";

function cleanTitle(title: string) {
  return title.replace(/\s*\(H\/F\)\s*/gi, " ").replace(/\s+/g, " ").trim();
}

function cityOf(location: string | null) {
  return (location ?? "").replace(/^\d{2,3}\s*-\s*/, "").trim();
}

function letterFor(offer: Offer) {
  const poste = cleanTitle(offer.title);
  const company = offer.company ?? "votre entreprise";
  return [
    "Madame, Monsieur,",
    `Votre offre de ${poste.toLowerCase()} chez ${company} a tout de suite retenu mon attention.`,
    "Je suis motivé(e), disponible rapidement et prêt(e) à apprendre vite sur le terrain.",
    "Je serais ravi(e) d'en parler avec vous lors d'un entretien.",
    "Bien cordialement,",
  ].join("\n\n");
}

// Écran de candidature du parcours de démo : animation seulement, aucune
// candidature n'est envoyée (mode démo, voir lib/demo/demoMode.ts).
export function DemoApply({ offer, onBack }: { offer: Offer; onBack: () => void }) {
  const letter = letterFor(offer);
  const [typed, setTyped] = useState(0);
  const [stage, setStage] = useState<"letter" | "cv" | "sending" | "sent">("letter");

  useEffect(() => {
    if (stage !== "letter") return;
    if (typed >= letter.length) {
      const t = window.setTimeout(() => setStage("cv"), 500);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setTyped((n) => Math.min(letter.length, n + 3)), 16);
    return () => window.clearTimeout(t);
  }, [typed, stage, letter.length]);

  useEffect(() => {
    if (stage === "cv") {
      const t = window.setTimeout(() => setStage("sending"), 900);
      return () => window.clearTimeout(t);
    }
    if (stage === "sending") {
      const t = window.setTimeout(() => setStage("sent"), 1400);
      return () => window.clearTimeout(t);
    }
  }, [stage]);

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-6">
      <div className="flex w-full max-w-sm flex-1 flex-col gap-4">
        <div className="flex items-center gap-1.5">
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>Stageio</span>
        </div>

        <motion.div className="card" style={{ padding: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="tag tag-accent" style={{ fontSize: 12 }}>
            {CONTRACT_LABEL[offer.contract_type] ?? offer.contract_type} · débutant accepté
          </span>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "10px 0 2px", letterSpacing: "-0.01em" }}>{cleanTitle(offer.title)}</h1>
          <p style={{ margin: 0, fontSize: 14, color: muted }}>
            {offer.company} · {cityOf(offer.location)}
          </p>
        </motion.div>

        <motion.div className="card" style={{ padding: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>✍️ Ta lettre de motivation</p>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", minHeight: 210 }}>
            {letter.slice(0, typed)}
            {stage === "letter" && <span style={{ opacity: 0.6 }}>▍</span>}
          </p>
        </motion.div>

        <AnimatePresence>
          {stage !== "letter" && (
            <motion.div className="card flex items-center gap-3" style={{ padding: 14 }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <span aria-hidden style={{ fontSize: 22 }}>📄</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Mon CV</p>
                <p style={{ margin: 0, fontSize: 12.5, color: muted }}>joint à la candidature</p>
              </div>
              <span style={{ color: "var(--color-accent-700)", fontWeight: 800 }}>✓</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: "auto" }}>
          <AnimatePresence mode="wait">
            {stage === "sent" ? (
              <motion.div key="sent" className="flex flex-col items-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14 }}
                  style={{ width: 64, height: 64, borderRadius: 32, background: "var(--color-accent)", color: "#fff", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 800 }}
                >
                  ✓
                </motion.div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Candidature envoyée 🎉</p>
                <p style={{ margin: 0, fontSize: 13.5, color: muted, textAlign: "center" }}>
                  {offer.company} a reçu ta lettre et ton CV. Tu retrouves le suivi dans « Mes candidatures ».
                </p>
                <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 6 }} onClick={onBack}>
                  Voir d&apos;autres offres
                </button>
              </motion.div>
            ) : (
              <motion.button key="send" type="button" className="btn btn-primary" style={{ width: "100%" }} disabled>
                {stage === "sending" ? "Envoi en cours…" : "Préparation de ta candidature…"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
