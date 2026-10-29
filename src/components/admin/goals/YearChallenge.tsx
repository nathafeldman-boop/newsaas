"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CHALLENGE, countdownParts, type ChallengeState } from "@/lib/admin/challenge";

// Minuteur du défi d'un an (29/10, Nathan : « un minuteur de 1 an […] pour
// faire les 100 000 euros ») : temps restant à la seconde, temps écoulé
// face à l'objectif atteint, rythme nécessaire et rythme mesuré.

const thousands = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const fmt = (cents: number) => `${thousands(Math.round(cents / 100))} €`;
const pct = (x: number) => `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: x < 0.1 ? 1 : 0 })} %`;

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="challenge-unit">
      <span className="challenge-num">{String(value).padStart(label === "jours" ? 3 : 2, "0")}</span>
      <span className="challenge-label">{label}</span>
    </div>
  );
}

function Bar({ label, share, value, tone }: { label: string; share: number; value: string; tone: "time" | "money" }) {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="flex items-center justify-between" style={{ fontSize: 12.5, fontWeight: 700 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div className="challenge-bar">
        <motion.div
          className={`challenge-bar-fill is-${tone}`}
          initial={{ width: reduce ? `${share * 100}%` : 0 }}
          animate={{ width: `${Math.max(share * 100, 1.5)}%` }}
          transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export function YearChallenge({ now, state }: { now: number; state: ChallengeState }) {
  const [t, setT] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const parts = countdownParts(CHALLENGE.end - t);
  const late = !state.reached && state.timeShare > state.moneyShare;

  return (
    <section className="challenge-card" aria-label="Défi d'un an : 100 000 €">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="challenge-kicker">⏳ Défi 1 an · {fmt(CHALLENGE.goalCents)}</p>
        <span className="challenge-chip">Fin le {CHALLENGE.endLabel}</span>
      </div>

      {state.reached ? (
        <p className="challenge-done">🎉 {fmt(CHALLENGE.goalCents)} atteints !</p>
      ) : state.over ? (
        <p className="challenge-done">Temps écoulé : {fmt(state.remainingCents)} manquaient.</p>
      ) : (
        <div className="challenge-clock" role="timer" aria-live="off">
          <Unit value={parts.days} label="jours" />
          <span className="challenge-sep">:</span>
          <Unit value={parts.hours} label="heures" />
          <span className="challenge-sep">:</span>
          <Unit value={parts.minutes} label="min" />
          <span className="challenge-sep">:</span>
          <Unit value={parts.seconds} label="sec" />
        </div>
      )}

      <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
        <Bar label="Temps écoulé" share={state.timeShare} value={pct(state.timeShare)} tone="time" />
        <Bar label={`Objectif atteint · reste ${fmt(state.remainingCents)}`} share={state.moneyShare} value={pct(state.moneyShare)} tone="money" />
      </div>

      {!state.reached && !state.over && state.neededPerDayCents !== null && (
        <div className="challenge-facts">
          <p>
            <strong>Il faut {fmt(state.neededPerDayCents)} par jour</strong>, soit {fmt(state.neededPerMonthCents ?? 0)} par mois, jusqu&apos;au {CHALLENGE.endLabel}.
          </p>
          <p>
            Rythme des 30 derniers jours : {fmt(state.pacePerDayCents)} par jour. À ce rythme : {fmt(state.projectedCents)} le {CHALLENGE.endLabel}
            {late ? ", il faut accélérer." : "."}
          </p>
        </div>
      )}
    </section>
  );
}
