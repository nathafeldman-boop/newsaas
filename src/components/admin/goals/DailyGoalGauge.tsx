"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/admin/cockpit/CountUp";
import type { DailyGoal } from "@/lib/admin/dailyGoal";

// Objectif du jour en haut de la vue d'ensemble (30/10) : ce qu'il faut
// encaisser aujourd'hui pour tenir l'objectif du mois, et où on en est.
// Même arc que la jauge du revenu total (onglet Objectifs).

const thousands = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const fmt = (cents: number) => `${thousands(Math.round(cents / 100))} €`;

const CX = 160;
const CY = 158;
const R = 132;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

export function DailyGoalGauge({ goal, dayLabel, monthName }: { goal: DailyGoal; dayLabel: string; monthName: string }) {
  const reduce = useReducedMotion();
  const { targetCents, todayCents } = goal;
  const ratio = targetCents > 0 ? todayCents / targetCents : 0;
  const fill = Math.min(1, Math.max(0, ratio));
  const tip = { x: CX + R * Math.cos(Math.PI * (1 - fill)), y: CY - R * Math.sin(Math.PI * (1 - fill)) };
  const why =
    goal.source === "mois" && goal.monthGoalCents !== null
      ? `Pour finir ${monthName} à ${fmt(goal.monthGoalCents)} : il reste ${fmt(goal.monthGoalCents - goal.monthBeforeTodayCents)} à encaisser en ${goal.daysToGo} jour${goal.daysToGo > 1 ? "s" : ""}, aujourd'hui compris.`
      : goal.source === "defi"
        ? `Rythme du défi 100 000 € (pas d'objectif restant pour ${monthName}).`
        : "Aucun objectif en cours : fixe celui du mois dans Objectifs.";

  return (
    <div className="goal-hero" style={{ padding: "14px 18px 14px" }}>
      <div className="flex flex-wrap items-center justify-between gap-2" style={{ position: "relative", zIndex: 1 }}>
        <p className="goal-hero-kicker" style={{ fontSize: 13 }}>Objectif du jour · {dayLabel}</p>
        <Link href="/admin/objectifs" className="goal-chip" style={{ color: "#fff", textDecoration: "none" }}>
          🎯 {targetCents > 0 ? `${fmt(targetCents)} à encaisser` : "Objectifs"} →
        </Link>
      </div>

      <div style={{ position: "relative", maxWidth: 240, margin: "2px auto 0" }}>
        <svg viewBox="0 0 320 190" width="100%" role="img" aria-label={`Encaissé aujourd'hui ${fmt(todayCents)} sur un objectif du jour de ${fmt(targetCents)}`}>
          <defs>
            <linearGradient id="daily-gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d7ffe9" />
              <stop offset="100%" stopColor={goal.reached ? "#ffd66b" : "#ffffff"} />
            </linearGradient>
          </defs>
          <path d={ARC} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={22} strokeLinecap="round" />
          <motion.path
            d={ARC}
            fill="none"
            stroke="url(#daily-gauge)"
            strokeWidth={22}
            strokeLinecap="round"
            initial={{ pathLength: reduce ? fill : 0 }}
            animate={{ pathLength: fill }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
          />
          {fill > 0.02 && (
            <motion.circle
              cx={tip.x}
              cy={tip.y}
              r={7}
              fill="#fff"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: [1, 1.25, 1] }}
              transition={{ opacity: { delay: 1.2 }, scale: { delay: 1.3, duration: 1.6, repeat: Infinity } }}
            />
          )}
          <text x={CX - R - 11} y={CY + 30} textAnchor="start" fontSize={14} fontWeight={700} fill="rgba(255,255,255,0.8)">
            0 €
          </text>
          <text x={CX + R + 11} y={CY + 30} textAnchor="end" fontSize={14} fontWeight={700} fill="rgba(255,255,255,0.8)">
            {fmt(targetCents)}
          </text>
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center" }}>
          <p className="goal-hero-amount" style={{ margin: 0, fontSize: 28 }}>
            <CountUp value={Math.round(todayCents / 100)} format={thousands} duration={1000} /> €
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 800 }}>
            {targetCents > 0 ? `sur ${fmt(targetCents)} aujourd'hui` : "encaissés aujourd'hui"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginTop: 2, position: "relative", zIndex: 1 }}>
        {goal.reached ? (
          <span className="goal-chip is-good">🎉 Objectif du jour atteint{todayCents > targetCents ? ` (+${fmt(todayCents - targetCents)})` : ""}</span>
        ) : targetCents > 0 ? (
          <span className="goal-chip">Reste {fmt(targetCents - todayCents)} aujourd&apos;hui</span>
        ) : null}
        <span className="goal-chip">
          {goal.todayPayments} paiement{goal.todayPayments > 1 ? "s" : ""} aujourd&apos;hui
        </span>
        {goal.monthGoalCents !== null && (
          <span className="goal-chip">
            {monthName.charAt(0).toUpperCase() + monthName.slice(1)} : {fmt(goal.monthDoneCents)} / {fmt(goal.monthGoalCents)}
          </span>
        )}
      </div>
      <p className="goal-hero-note" style={{ margin: "8px 0 0", textAlign: "center", position: "relative", zIndex: 1 }}>
        {why} Renouvellements et nouveaux paiements comptent, remboursements déduits (Stripe).
      </p>
    </div>
  );
}
