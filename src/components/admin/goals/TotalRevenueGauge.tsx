"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/admin/cockpit/CountUp";

// Grande jauge en haut de la vue d'ensemble (28/10, Nathan : « une grosse
// jauge en haut avec écrit revenu total de Stageio ») : encaissé net depuis
// le premier paiement face à l'objectif global (modifiable dans Objectifs).
// Arc qui se remplit, montant qui défile, repères à 25 / 50 / 75 %.

const thousands = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const fmt = (cents: number) => `${thousands(Math.round(cents / 100))} €`;

const CX = 160;
const CY = 158;
const R = 132;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

function tick(ratio: number) {
  const a = Math.PI * (1 - ratio);
  return { x1: CX + (R - 18) * Math.cos(a), y1: CY - (R - 18) * Math.sin(a), x2: CX + (R + 4) * Math.cos(a), y2: CY - (R + 4) * Math.sin(a) };
}

export function TotalRevenueGauge({
  totalCents,
  goalCents,
  goalIsDefault,
  monthCents,
  monthName,
  refundedCents,
}: {
  totalCents: number;
  goalCents: number;
  goalIsDefault: boolean;
  monthCents: number;
  monthName: string;
  refundedCents: number;
}) {
  const reduce = useReducedMotion();
  const ratio = goalCents > 0 ? totalCents / goalCents : 0;
  const fill = Math.min(1, ratio);
  const reached = ratio >= 1;
  const tip = { x: CX + R * Math.cos(Math.PI * (1 - fill)), y: CY - R * Math.sin(Math.PI * (1 - fill)) };

  return (
    <div className="goal-hero" style={{ padding: "14px 18px 14px" }}>
      <div className="flex flex-wrap items-center justify-between gap-2" style={{ position: "relative", zIndex: 1 }}>
        <p className="goal-hero-kicker" style={{ fontSize: 13 }}>Revenu total de Stageio</p>
        <Link href="/admin/objectifs#objectif-global" className="goal-chip" style={{ color: "#fff", textDecoration: "none" }}>
          🎯 Objectif : {fmt(goalCents)}
          {goalIsDefault ? " · modifier" : ""}
        </Link>
      </div>

      {/* Plus petite (29/10, Nathan : « mets-la plus petite ») : 240 px de large au plus. */}
      <div style={{ position: "relative", maxWidth: 240, margin: "2px auto 0" }}>
        <svg viewBox="0 0 320 190" width="100%" role="img" aria-label={`Revenu total ${fmt(totalCents)} sur un objectif de ${fmt(goalCents)}, ${Math.round(ratio * 100)} %`}>
          <defs>
            <linearGradient id="total-gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d7ffe9" />
              <stop offset="100%" stopColor={reached ? "#ffd66b" : "#ffffff"} />
            </linearGradient>
          </defs>
          <path d={ARC} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={22} strokeLinecap="round" />
          <motion.path
            d={ARC}
            fill="none"
            stroke="url(#total-gauge)"
            strokeWidth={22}
            strokeLinecap="round"
            initial={{ pathLength: reduce ? fill : 0 }}
            animate={{ pathLength: fill }}
            transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
          />
          {[0.25, 0.5, 0.75].map((r) => {
            const t = tick(r);
            return <line key={r} {...t} stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" />;
          })}
          {fill > 0.02 && (
            <motion.circle
              cx={tip.x}
              cy={tip.y}
              r={7}
              fill="#fff"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: [1, 1.25, 1] }}
              transition={{ opacity: { delay: 1.4 }, scale: { delay: 1.5, duration: 1.6, repeat: Infinity } }}
            />
          )}
          <text x={CX - R - 11} y={CY + 30} textAnchor="start" fontSize={14} fontWeight={700} fill="rgba(255,255,255,0.8)">
            0 €
          </text>
          <text x={CX + R + 11} y={CY + 30} textAnchor="end" fontSize={14} fontWeight={700} fill="rgba(255,255,255,0.8)">
            {fmt(goalCents)}
          </text>
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center" }}>
          <p className="goal-hero-amount" style={{ margin: 0, fontSize: 28 }}>
            <CountUp value={Math.round(totalCents / 100)} format={thousands} duration={1200} /> €
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 800 }}>
            <CountUp value={Math.round(ratio * 100)} duration={1200} /> % de l&apos;objectif
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginTop: 2, position: "relative", zIndex: 1 }}>
        <span className="goal-chip">
          {monthName} : {fmt(monthCents)}
        </span>
        {reached ? (
          <span className="goal-chip is-good">🎉 Objectif atteint</span>
        ) : (
          <span className="goal-chip">Reste {fmt(Math.max(0, goalCents - totalCents))}</span>
        )}
        <span className="goal-hero-note">
          Encaissé net depuis le premier paiement (Stripe){refundedCents > 0 ? `, ${fmt(refundedCents)} de remboursements déduits` : ""}.
        </span>
      </div>
    </div>
  );
}
