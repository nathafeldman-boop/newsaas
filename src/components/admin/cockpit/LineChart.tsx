"use client";

import { useEffect, useRef, useState } from "react";
import { AXIS_TEXT, GRID_COLOR, dayLabel, formatTick, formatValue, niceMax, type ChartUnit } from "@/components/admin/cockpit/chartUtils";

export type LineSeries = { name: string; color: string; values: number[] };

// Courbe d'une ou deux séries sur un même axe (jamais deux échelles) :
// ligne 2 px, voile à 10 %, réticule qui suit le pointeur et infobulle
// avec toutes les séries, tableau équivalent sous le graphique.
export function LineChart({
  times,
  series,
  unit,
  height = 200,
  caption,
}: {
  times: number[];
  series: LineSeries[];
  unit: ChartUnit;
  height?: number;
  caption: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = times.length;
  if (n === 0) return <p style={{ fontSize: 13, color: AXIS_TEXT }}>Données insuffisantes sur cette période.</p>;

  const padLeft = 52;
  const padRight = 12;
  const padTop = 10;
  const axisBand = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - axisBand;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  const x = (i: number) => padLeft + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v: number) => padTop + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelIdx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [...Array(n).keys()];

  const indexAt = (clientX: number, rect: DOMRect) => {
    const rel = ((clientX - rect.left) / rect.width) * width - padLeft;
    return Math.max(0, Math.min(n - 1, Math.round((rel / plotW) * (n - 1))));
  };

  const tipLeft = hover !== null ? Math.min(Math.max(x(hover) + 10, 0), width - 170) : 0;

  return (
    <figure style={{ margin: 0 }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={caption}
          tabIndex={0}
          style={{ display: "block", outline: "none", touchAction: "pan-y" }}
          onPointerMove={(e) => setHover(indexAt(e.clientX, e.currentTarget.getBoundingClientRect()))}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(n - 1)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
            if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={padLeft - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {formatTick(t, unit)}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={AXIS_TEXT}>
              {dayLabel(times[i])}
            </text>
          ))}
          {series.map((s) => {
            const line = s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
            const area = `${line} L ${x(n - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
            return (
              <g key={s.name}>
                <path d={area} fill={s.color} opacity={0.1} />
                <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={4} fill={s.color} stroke="#f2f8f9" strokeWidth={2} />
              </g>
            );
          })}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={padTop} y2={padTop + plotH} stroke="var(--color-neutral-500)" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke="#f2f8f9" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: 4,
              left: tipLeft,
              minWidth: 150,
              background: "#fff",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: 10,
              boxShadow: "var(--shadow-sm)",
              padding: "8px 10px",
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            <div style={{ color: AXIS_TEXT, marginBottom: 4 }}>{dayLabel(times[hover])}</div>
            {series.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden style={{ width: 12, height: 2, background: s.color, borderRadius: 1 }} />
                <strong>{formatValue(s.values[hover], unit)}</strong>
                <span style={{ color: AXIS_TEXT }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 6, color: AXIS_TEXT }}>
          {series.map((s) => (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 14, height: 2, background: s.color, borderRadius: 1 }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <details style={{ marginTop: 6, fontSize: 12 }}>
        <summary style={{ cursor: "pointer", color: AXIS_TEXT }}>Voir le tableau</summary>
        <div style={{ maxHeight: 240, overflow: "auto", marginTop: 6 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Jour</th>
                {series.map((s) => (
                  <th key={s.name}>{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((t, i) => (
                <tr key={t}>
                  <td>{dayLabel(t)}</td>
                  {series.map((s) => (
                    <td key={s.name}>{formatValue(s.values[i], unit)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
