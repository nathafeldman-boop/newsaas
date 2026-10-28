"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AXIS_TEXT, GRID_COLOR, niceMax } from "@/components/admin/cockpit/chartUtils";

// Barres mois par mois de l'onglet Historique (28/10) : le réel en plein,
// la prévision hachurée au-dessus (reste du mois en cours, mois à venir).
// Une seule couleur, la prévision se lit à la texture ; valeur au-dessus de
// chaque barre, détail au survol.

const GREEN = "#0f9c56";

export type MonthBar = { key: string; label: string; actual: number; forecast: number | null };

export function MonthBars({ bars, unit, height = 240, title }: { bars: MonthBar[]; unit: "eur" | "count"; height?: number; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmt = (v: number) =>
    unit === "eur"
      ? `${Math.round(v / 100).toLocaleString("fr-FR").replace(/ /g, " ")} €`
      : Math.round(v).toLocaleString("fr-FR").replace(/ /g, " ");
  const n = bars.length;
  if (n === 0) return null;
  const padLeft = 54;
  const padRight = 8;
  const padTop = 22;
  const axisBand = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - axisBand;
  const top = (b: MonthBar) => Math.max(b.actual, b.forecast ?? 0);
  const max = niceMax(Math.max(1, ...bars.map(top)) * 1.08);
  const slot = plotW / n;
  const barW = Math.min(56, slot * 0.62);
  const y = (v: number) => padTop + plotH - (Math.max(0, v) / max) * plotH;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const hasForecast = bars.some((b) => b.forecast !== null && b.forecast > b.actual);

  return (
    <figure style={{ margin: 0 }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg width={width} height={height} role="img" aria-label={title} onMouseLeave={() => setHover(null)} style={{ display: "block" }}>
          <defs>
            <pattern id={`hatch-${unit}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#d6efe1" />
              <line x1="0" y1="0" x2="0" y2="6" stroke={GREEN} strokeWidth="2.2" opacity="0.55" />
            </pattern>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={padLeft - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {fmt(t)}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const cx = padLeft + slot * i + slot / 2;
            const x = cx - barW / 2;
            const fTop = b.forecast !== null && b.forecast > b.actual ? b.forecast : null;
            const shown = fTop ?? b.actual;
            return (
              <g key={b.key} onMouseEnter={() => setHover(i)} style={{ cursor: "default" }}>
                <rect x={padLeft + slot * i} y={padTop} width={slot} height={plotH} fill="transparent" />
                {fTop !== null && (
                  <motion.rect
                    x={x}
                    width={barW}
                    rx={4}
                    fill={`url(#hatch-${unit})`}
                    stroke={GREEN}
                    strokeOpacity={0.45}
                    strokeDasharray="3 3"
                    initial={{ y: y(0), height: 0 }}
                    animate={{ y: y(fTop), height: y(b.actual) - y(fTop) + 4 }}
                    transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.1 + i * 0.05 }}
                  />
                )}
                {b.actual > 0 && (
                  <motion.rect
                    x={x}
                    width={barW}
                    rx={4}
                    fill={GREEN}
                    initial={{ y: y(0), height: 0 }}
                    animate={{ y: y(b.actual), height: y(0) - y(b.actual) }}
                    transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : i * 0.05 }}
                  />
                )}
                <text x={cx} y={y(shown) - 6} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--color-text)">
                  {fTop !== null ? `≈ ${fmt(fTop)}` : fmt(b.actual)}
                </text>
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT} style={{ textTransform: "capitalize" }}>
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            className="cockpit-tip"
            style={{ position: "absolute", top: 4, left: Math.min(Math.max(padLeft + slot * hover + slot / 2 - 90, 0), width - 190), pointerEvents: "none" }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2, textTransform: "capitalize" }}>{bars[hover].label}</div>
            <div>Réel : {fmt(bars[hover].actual)}</div>
            {bars[hover].forecast !== null && <div>Prévision du mois : ≈ {fmt(bars[hover].forecast!)}</div>}
          </div>
        )}
      </div>
      <figcaption className="goal-legend">
        <span>
          <i style={{ background: GREEN, height: 10, width: 12, borderRadius: 3 }} /> Réel
        </span>
        {hasForecast && (
          <span>
            <i style={{ background: "repeating-linear-gradient(45deg, #d6efe1 0 3px, rgba(15,156,86,0.55) 3px 5px)", height: 10, width: 12, borderRadius: 3 }} /> Prévision
          </span>
        )}
      </figcaption>
    </figure>
  );
}
