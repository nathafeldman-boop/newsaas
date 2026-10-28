"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/admin/cockpit/CountUp";

// Bandeau de l'objectif du mois (26/10, Nathan : « une barre stylée ») :
// encaissé qui défile jusqu'à son montant, barre qui se remplit, repère du
// rythme attendu aujourd'hui et projection de fin de mois en pointillé.

// Espace insécable classique : la police en graisse 800 n'a pas l'espace fine de toLocaleString.
const thousands = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0");
const fmt = (cents: number) => `${thousands(Math.round(cents / 100))} €`;

export function GoalHero({
  title,
  achievedCents,
  goalCents,
  expectedRatio,
  projectionCents,
  status,
  note,
}: {
  title: string;
  achievedCents: number;
  goalCents: number;
  expectedRatio: number;
  projectionCents: number | null;
  status: "past" | "current" | "future";
  note: string;
}) {
  const reduce = useReducedMotion();
  const done = goalCents > 0 ? achievedCents / goalCents : 0;
  const bar = Math.min(1, done);
  const projection = projectionCents !== null && goalCents > 0 ? Math.min(1, projectionCents / goalCents) : null;
  const reached = done >= 1;
  const ahead = achievedCents - goalCents * expectedRatio;

  return (
    <div className="goal-hero">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="goal-hero-kicker">{title}</p>
          <p className="goal-hero-amount">
            <CountUp value={Math.round(achievedCents / 100)} format={thousands} /> €<span className="goal-hero-of"> / {fmt(goalCents)}</span>
          </p>
        </div>
        <div className="goal-hero-pct" aria-label={`${Math.round(done * 100)} % de l'objectif`}>
          <CountUp value={Math.round(done * 100)} />
          <span>%</span>
        </div>
      </div>

      <div className="goal-bar" role="img" aria-label={`Encaissé ${fmt(achievedCents)} sur ${fmt(goalCents)}`}>
        {projection !== null && status === "current" && projection > bar && <div className="goal-bar-projection" style={{ width: `${projection * 100}%` }} />}
        <motion.div
          className={`goal-bar-fill${reached ? " is-reached" : ""}`}
          initial={{ width: reduce ? `${bar * 100}%` : "0%" }}
          animate={{ width: `${bar * 100}%` }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
        >
          <span className="goal-bar-shine" aria-hidden />
        </motion.div>
        {status === "current" && expectedRatio > 0 && expectedRatio < 1 && (
          <div className="goal-bar-marker" style={{ left: `${expectedRatio * 100}%` }}>
            <span>Rythme attendu</span>
          </div>
        )}
      </div>
      <div className="goal-bar-scale" aria-hidden>
        {[0, 25, 50, 75, 100].map((p) => (
          <span key={p}>{p} %</span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 12 }}>
        {status === "current" && (
          <span className={`goal-chip ${ahead >= 0 ? "is-good" : "is-late"}`}>
            {ahead >= 0 ? `▲ En avance de ${fmt(ahead)} sur le rythme` : `▼ En retard de ${fmt(-ahead)} sur le rythme`}
          </span>
        )}
        {status === "current" && projectionCents !== null && (
          <span className="goal-chip">Projection fin de mois : {fmt(projectionCents)} ({Math.round((projectionCents / Math.max(1, goalCents)) * 100)} %)</span>
        )}
        {reached && <span className="goal-chip is-good">🎉 Objectif atteint</span>}
        <span className="goal-hero-note">{note}</span>
      </div>
    </div>
  );
}
