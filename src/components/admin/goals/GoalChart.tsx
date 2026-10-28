"use client";

import { useEffect, useRef, useState } from "react";
import { AXIS_TEXT, GRID_COLOR, dayLabel, niceMax } from "@/components/admin/cockpit/chartUtils";

// Courbe d'argent du mois (26/10, Nathan : « une courbe d'argent ») : cumul
// encaissé jour après jour (aire verte), rythme régulier vers l'objectif
// (tirets gris), ligne de l'objectif, et projection de fin de mois au rythme
// des 7 derniers jours (pointillés). Un seul axe, en euros. Réticule et
// infobulle au survol ; tableau jour par jour sous la page.

const GREEN = "#0f9c56";
const PACE = "#8aa3aa";
const GOAL = "#d98a00";

const eur = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 }).replace(/\u202f/g, "\u00a0")} €`;

export function GoalChart({
  times,
  daily,
  cumulative,
  goalCents,
  projectionCents,
  height = 260,
}: {
  /** Début de chaque jour du mois (tous les jours, même à venir). */
  times: number[];
  /** Encaissé de chaque jour écoulé. */
  daily: number[];
  /** Cumul de chaque jour écoulé. */
  cumulative: number[];
  goalCents: number;
  projectionCents: number | null;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = times.length;
  if (n === 0) return null;
  const elapsed = cumulative.length;
  const padLeft = 56;
  const padRight = 14;
  const padTop = 16;
  const axisBand = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - axisBand;
  const max = niceMax(Math.max(goalCents, projectionCents ?? 0, ...cumulative, 1) * 1.05);
  const x = (i: number) => padLeft + (n > 1 ? ((i + 1) / n) * plotW : plotW);
  const x0 = padLeft;
  const y = (v: number) => padTop + plotH - (Math.max(0, v) / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  const actual = cumulative.map((v, i) => `${x(i)},${y(v)}`);
  const line = [`${x0},${y(0)}`, ...actual].join(" ");
  const area = `M${x0},${y(0)} L${actual.join(" L")} L${elapsed > 0 ? x(elapsed - 1) : x0},${y(0)} Z`;
  const last = elapsed > 0 ? { x: x(elapsed - 1), y: y(cumulative[elapsed - 1]) } : { x: x0, y: y(0) };
  const showProjection = projectionCents !== null && elapsed > 0 && elapsed < n;
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  const indexAt = (clientX: number, rect: DOMRect) => {
    const rel = ((clientX - rect.left) / rect.width) * width - padLeft;
    return Math.max(0, Math.min(n - 1, Math.round((rel / plotW) * n) - 1));
  };
  const pace = (i: number) => Math.round((goalCents * (i + 1)) / n);
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) + 10, 0), width - 190) : 0;

  return (
    <figure style={{ margin: 0 }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Cumul encaissé : ${eur(cumulative[elapsed - 1] ?? 0)} sur un objectif de ${eur(goalCents)}`}
          onMouseMove={(e) => setHover(indexAt(e.clientX, e.currentTarget.getBoundingClientRect()))}
          onMouseLeave={() => setHover(null)}
          style={{ display: "block", touchAction: "pan-y" }}
          onTouchMove={(e) => setHover(indexAt(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()))}
        >
          <defs>
            <linearGradient id="goal-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity="0.32" />
              <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={padLeft - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {eur(t)}
              </text>
            </g>
          ))}
          {/* Objectif */}
          <line x1={padLeft} x2={width - padRight} y1={y(goalCents)} y2={y(goalCents)} stroke={GOAL} strokeWidth={1.5} strokeDasharray="6 4" />
          <text x={width - padRight} y={y(goalCents) - 6} textAnchor="end" fontSize={11.5} fontWeight={700} fill={GOAL}>
            Objectif {eur(goalCents)}
          </text>
          {/* Rythme régulier */}
          <line x1={x0} y1={y(0)} x2={x(n - 1)} y2={y(goalCents)} stroke={PACE} strokeWidth={1.5} strokeDasharray="3 4" />
          {/* Encaissé */}
          {elapsed > 0 && <path d={area} fill="url(#goal-area)" className="goal-area" />}
          {elapsed > 0 && <polyline points={line} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="goal-line" />}
          {showProjection && (
            <line x1={last.x} y1={last.y} x2={x(n - 1)} y2={y(projectionCents!)} stroke={GREEN} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
          )}
          {showProjection && <circle cx={x(n - 1)} cy={y(projectionCents!)} r={4} fill="#fff" stroke={GREEN} strokeWidth={2} />}
          {elapsed > 0 && (
            <>
              <circle cx={last.x} cy={last.y} r={9} fill={GREEN} opacity={0.18} className="goal-pulse" />
              <circle cx={last.x} cy={last.y} r={4.5} fill={GREEN} stroke="#fff" strokeWidth={2} />
            </>
          )}
          {labelIdx.map((i) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={AXIS_TEXT}>
              {dayLabel(times[i])}
            </text>
          ))}
          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={padTop} y2={padTop + plotH} stroke="#9fb3b8" strokeWidth={1} />
              {hover < elapsed && <circle cx={x(hover)} cy={y(cumulative[hover])} r={4} fill={GREEN} stroke="#fff" strokeWidth={1.5} />}
            </>
          )}
        </svg>
        {hover !== null && (
          <div className="cockpit-tip" style={{ position: "absolute", top: 8, left: tipLeft, pointerEvents: "none" }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{dayLabel(times[hover])}</div>
            {hover < elapsed ? (
              <>
                <div>Ce jour-là : {eur(daily[hover])}</div>
                <div>
                  Cumul : <b>{eur(cumulative[hover])}</b>
                </div>
              </>
            ) : (
              <div>Jour à venir</div>
            )}
            <div style={{ color: AXIS_TEXT }}>Rythme cible : {eur(pace(hover))}</div>
          </div>
        )}
      </div>
      <figcaption className="goal-legend">
        <span>
          <i style={{ background: GREEN }} /> Encaissé (cumul)
        </span>
        <span>
          <i className="is-dashed" style={{ borderColor: PACE }} /> Rythme régulier vers l&apos;objectif
        </span>
        {showProjection && (
          <span>
            <i className="is-dotted" style={{ borderColor: GREEN }} /> Projection (rythme des 7 derniers jours)
          </span>
        )}
        <span>
          <i className="is-dashed" style={{ borderColor: GOAL }} /> Objectif
        </span>
      </figcaption>
    </figure>
  );
}
