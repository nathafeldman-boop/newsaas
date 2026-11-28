"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import type { ContractType } from "@/types/database";
import { GUARANTEE_48H_APPLICATIONS } from "@/lib/premium/guaranteeTerms";

// Fin d'onboarding (28/11, Nathan) : « quand veux-tu ton premier
// entretien ? » puis « calcul de ton potentiel ». Le potentiel ne promet
// aucun nombre d'entretiens (aucune donnée réelle là-dessus) : il montre
// des chiffres comptés en base pour la personne (offres qui lui
// correspondent, arrivées cette semaine) et le plan d'action qui découle de
// son objectif, adossé à la garantie 48 h.

export type InterviewGoal = "today" | "week" | "month";

const GOALS: { id: InterviewGoal; label: string; sub: string; badge: string; badgeBg: string; badgeFg: string; emoji: string }[] = [
  { id: "today", label: "Aujourd'hui", sub: "Je veux décrocher un entretien dès maintenant", badge: "AMBITIEUX", badgeBg: "#fde68a", badgeFg: "#7c4a03", emoji: "🔥" },
  { id: "week", label: "Cette semaine", sub: "Un entretien dans les prochains jours", badge: "GARANTIE 48 H", badgeBg: "var(--color-accent)", badgeFg: "var(--color-bg)", emoji: "🛡️" },
  { id: "month", label: "Ce mois-ci", sub: "Pas pressé(e), je verrai bien", badge: "DÉFAITISTE", badgeBg: "#fde2e1", badgeFg: "#9f1d1d", emoji: "🐢" },
];

export function GoalScreen({ value, onPick }: { value: InterviewGoal | null; onPick: (goal: InterviewGoal) => void }) {
  return (
    <div className="flex flex-1 flex-col px-1">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: 20,
          padding: "18px 18px 20px",
          background: "linear-gradient(135deg, #0f5132, var(--color-accent))",
          color: "#fff",
          boxShadow: "0 12px 30px -14px rgba(15,81,50,.6)",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, opacity: 0.85 }}>🎯 TON OBJECTIF</p>
        <h1 style={{ margin: "8px 0 0", fontSize: 27, lineHeight: 1.15, color: "#fff" }}>Quand veux-tu ton premier entretien&nbsp;?</h1>
      </motion.div>

      <div className="flex flex-col gap-3" style={{ marginTop: 20 }}>
        {GOALS.map((g, i) => {
          const on = value === g.id;
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => onPick(g.id)}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0, scale: on ? 1.02 : 1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ delay: 0.12 + i * 0.1, type: "spring", stiffness: 320, damping: 22 }}
              style={{
                position: "relative",
                textAlign: "left",
                borderRadius: 18,
                padding: "22px 16px 16px",
                border: on ? "2px solid var(--color-accent)" : "1.5px solid color-mix(in srgb, var(--color-text) 14%, transparent)",
                background: on ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))" : "var(--color-surface)",
                boxShadow: on ? "0 10px 24px -14px rgba(15,81,50,.55)" : "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -11,
                  left: 14,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: g.badgeBg,
                  color: g.badgeFg,
                }}
              >
                {g.badge}
              </span>
              <span className="flex items-center gap-3">
                <span aria-hidden style={{ fontSize: 30 }}>
                  {g.emoji}
                </span>
                <span className="flex flex-col">
                  <span style={{ fontSize: 19, fontWeight: 800 }}>{g.label}</span>
                  <span style={{ fontSize: 13.5, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{g.sub}</span>
                </span>
                <span
                  aria-hidden
                  style={{
                    marginLeft: "auto",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: on ? "7px solid var(--color-accent)" : "2px solid color-mix(in srgb, var(--color-text) 25%, transparent)",
                    flexShrink: 0,
                  }}
                />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export type PotentialCounts = { matching: number | null; thisWeek: number | null };

const SCAN_STEPS = ["Lecture de ton profil", "Recherche des offres qui te correspondent", "Offres publiées cette semaine", "Calcul de ton plan"];

function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.4, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to]);
  return <>{n.toLocaleString("fr-FR").replace(/ /g, " ")}</>;
}

// Objectif d'entretiens (28/11, Nathan : « minimum 2 en 24 h, une
// vingtaine dans la semaine, une quarantaine dans le mois ») : affiché comme
// l'OBJECTIF que la personne se fixe, jamais comme un résultat calculé ou
// promis (aucune donnée réelle sur les entretiens obtenus). Le plan
// d'action, lui, est un fait produit (rythme de la garantie 48 h).
const OBJECTIVE: Record<InterviewGoal, { interviews: number; when: string }> = {
  today: { interviews: 2, when: "d'ici demain" },
  week: { interviews: 20, when: "cette semaine" },
  month: { interviews: 40, when: "ce mois-ci" },
};

function plan(goal: InterviewGoal): { title: string; detail: string } {
  if (goal === "today")
    return { title: `${GUARANTEE_48H_APPLICATIONS / 2} candidatures dès aujourd'hui`, detail: `Postule vite : les candidatures des premières heures sont lues en premier.` };
  if (goal === "week")
    return { title: `${GUARANTEE_48H_APPLICATIONS} candidatures en 48 h`, detail: "C'est le rythme couvert par notre garantie : pas d'entretien en 48 h, on te rembourse (conditions dans les CGV)." };
  return { title: "Des candidatures chaque jour", detail: "Chaque jour sans postuler, d'autres prennent les places." };
}

export function PotentialScreen({ goal, contractLabel, counts, onNext }: { goal: InterviewGoal; contractLabel: string; counts: PotentialCounts | null; onNext: () => void }) {
  const [step, setStep] = useState(0);
  const done = step >= SCAN_STEPS.length && counts !== null;
  useEffect(() => {
    if (step >= SCAN_STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [step]);
  const p = plan(goal);
  const progress = Math.min(100, Math.round((step / SCAN_STEPS.length) * 100));

  return (
    <div className="flex flex-1 flex-col px-1">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="scan" exit={{ opacity: 0, y: -10 }} className="flex flex-1 flex-col justify-center">
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--color-accent)" }}>⚡ CALCUL DE TON POTENTIEL</p>
            <h1 style={{ fontSize: 26, margin: "8px 0 0", lineHeight: 1.18 }}>On analyse le marché pour toi…</h1>
            <div style={{ marginTop: 22, height: 12, borderRadius: 999, background: "color-mix(in srgb, var(--color-text) 10%, transparent)", overflow: "hidden" }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--color-accent), #34d399)" }} />
            </div>
            <p style={{ textAlign: "right", fontWeight: 800, margin: "6px 0 0", fontSize: 14 }}>{progress} %</p>
            <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
              {SCAN_STEPS.map((s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: i <= step ? 1 : 0.3 }}
                  style={{ margin: 0, fontSize: 15, fontWeight: 600 }}
                >
                  {i < step ? "✅" : i === step ? "⏳" : "◻️"} {s}
                </motion.p>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--color-accent)" }}>⚡ TON POTENTIEL</p>
            <h1 style={{ fontSize: 26, margin: "8px 0 0", lineHeight: 1.18 }}>Tu as de quoi décrocher ton entretien.</h1>

            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 18 }}>
              {[
                { n: counts?.matching, label: `offres${contractLabel ? ` ${contractLabel}` : ""} pour toi, en ligne maintenant` },
                { n: counts?.thisWeek, label: "publiées ces 7 derniers jours" },
              ].map((c, i) =>
                c.n != null ? (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.15, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ borderRadius: 18, padding: "16px 14px", background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))" }}
                  >
                    <p style={{ margin: 0, fontSize: 34, fontWeight: 900, color: "var(--color-accent-800, #0f5132)", lineHeight: 1 }}>
                      <Counter to={c.n} />
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.35, fontWeight: 600 }}>{c.label}</p>
                  </motion.div>
                ) : null,
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 240, damping: 18 }}
              className="flex items-center gap-3"
              style={{ marginTop: 14, borderRadius: 18, padding: "14px 16px", border: "2px dashed var(--color-accent)" }}
            >
              <span style={{ fontSize: 40, fontWeight: 900, color: "var(--color-accent)", lineHeight: 1 }}>
                <Counter to={OBJECTIVE[goal].interviews} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                entretiens {OBJECTIVE[goal].when} : c&apos;est ton objectif. Voici comment t&apos;en donner les moyens 👇
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              style={{ marginTop: 12, borderRadius: 18, padding: "16px 16px", background: "linear-gradient(135deg, #0f5132, var(--color-accent))", color: "#fff" }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, opacity: 0.85 }}>🚀 TON PLAN ({GOALS.find((g) => g.id === goal)?.label.toUpperCase()})</p>
              <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 900 }}>{p.title}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.45, opacity: 0.92 }}>{p.detail}</p>
            </motion.div>
            <p style={{ fontSize: 12, margin: "10px 0 0", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              Offres comptées en direct sur Stageio pour ton contrat et ta zone.
            </p>
            <div className="flex-1" />
            <button type="button" onClick={onNext} className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
              C&apos;est parti →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
