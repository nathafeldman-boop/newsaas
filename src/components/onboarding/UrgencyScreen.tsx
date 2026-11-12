"use client";

import { motion } from "framer-motion";
import type { ContractType } from "@/types/database";
import { painCopy } from "@/lib/premium/painCopy";

// Écran « Le temps presse » (12/11, Nathan) : après « Tu peux commencer
// quand ? ». La douleur (le délai qui file, ce qu'on perd à attendre) puis
// l'investissement (le salaire légal minimum face au prix de Premium).
// Textes et chiffres : lib/premium/painCopy.ts, uniquement des faits vrais.

const PAIN_BG = "#fdeee6";
const muted = "color-mix(in srgb, var(--color-text) 66%, transparent)";

export function UrgencyScreen({ lookingFor, onNext }: { lookingFor: ContractType[]; onNext: () => void }) {
  const copy = painCopy(lookingFor);
  const rows = [
    { icon: "⏳", text: copy.deadline, tone: PAIN_BG },
    { icon: "⚠️", text: copy.pain, tone: PAIN_BG },
    { icon: "💶", text: copy.investment, tone: "var(--color-accent-100)" },
  ];
  return (
    <div className="flex flex-1 flex-col px-2">
      <div className="flex flex-1 flex-col justify-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 800, padding: "5px 12px", margin: 0, borderRadius: 999, background: "#fbdcc9", color: "#8a3410" }}
        >
          LE TEMPS PRESSE
        </motion.p>
        <h1 style={{ fontSize: 27, margin: "12px 0 0", lineHeight: 1.18 }}>Chaque semaine d&apos;attente te coûte.</h1>
        <div className="flex flex-col gap-3" style={{ marginTop: 20 }}>
          {rows.map((row, i) => (
            <motion.div
              key={row.icon}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.25, duration: 0.35 }}
              className="flex gap-3"
              style={{ background: row.tone, borderRadius: 14, padding: "12px 14px" }}
            >
              <span aria-hidden style={{ fontSize: 20, lineHeight: 1.3 }}>
                {row.icon}
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, fontWeight: i === 2 ? 700 : 500 }}>{row.text}</p>
            </motion.div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, margin: "14px 0 0", color: muted }}>
          Minimums légaux 2026 (SMIC, grille apprentissage, gratification de stage).
        </p>
      </div>
      <button type="button" onClick={onNext} className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
        Je m&apos;y mets maintenant
      </button>
    </div>
  );
}
