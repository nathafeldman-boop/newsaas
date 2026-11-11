"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Compteur en haut à droite (11/11, Nathan) : candidatures automatiques
// qu'il reste à envoyer (le reste du jour pour la formule Auto, plus les
// candidatures achetées). 0 pour un Premium sans la formule Auto. Le « + »
// mène à la page de vente des candidatures en plus.

export type ApplicationsCounterData = { remaining: number; credits: number; auto: boolean };

export function ApplicationsCounter({ data }: { data: ApplicationsCounterData }) {
  const title = data.auto
    ? `${data.remaining} candidatures automatiques restantes${data.credits > 0 ? ` (dont ${data.credits} achetées)` : " aujourd'hui"}`
    : `${data.remaining} candidatures automatiques`;
  return (
    <div
      className="flex items-center"
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 30,
        gap: 2,
        padding: 3,
        borderRadius: 999,
        border: "1px solid var(--color-divider)",
        background: "var(--color-neutral-100)",
        boxShadow: "var(--shadow-sm, 0 2px 8px rgba(0,0,0,.06))",
      }}
    >
      <Link
        href="/premium/candidatures"
        title={title}
        aria-label={title}
        className="flex items-center"
        style={{ gap: 6, padding: "4px 8px 4px 10px", color: "var(--color-text)", textDecoration: "none", fontWeight: 800, fontSize: 14 }}
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-600)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{data.remaining.toLocaleString("fr-FR")}</span>
      </Link>
      <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} style={{ display: "flex" }}>
        <Link
          href="/premium/candidatures"
          aria-label="Ajouter des candidatures"
          className="flex items-center justify-center"
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "var(--color-accent-600)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 18,
            lineHeight: 1,
            textDecoration: "none",
          }}
        >
          +
        </Link>
      </motion.span>
    </div>
  );
}
