"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AXIS_TEXT, GRID_COLOR, dayLabel, formatTick, formatValue, niceMax, type ChartUnit } from "@/components/admin/cockpit/chartUtils";

export type BarSeries = { name: string; color: string; values: number[] };

// Colonnes par jour, empilées (part d'un total) ou côte à côte (deux
// mesures à comparer). Barres de 24 px max, haut arrondi, espace de 2 px
// entre segments, infobulle par colonne, tableau équivalent.
export function BarChart({
  times,
  series,
  unit,
  mode = "stacked",
  height = 200,
  caption,
  hrefs,
  notes,
  maxValue,
}: {
  times: number[];
  series: BarSeries[];
  unit: ChartUnit;
  mode?: "stacked" | "grouped";
  height?: number;
  caption: string;
  // Détail de chaque colonne (25/10) : un clic sur un jour ouvre sa page.
  hrefs?: (string | null)[];
  /** Lignes en plus dans l'infobulle de chaque colonne (inscrits, vues, RPM…). */
  notes?: (string[] | null)[];
  /** Même échelle pour plusieurs graphiques (petits multiples) : le plus haut de tous. */
  maxValue?: number;
}) {
  const router = useRouter();
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
  const padRight = 8;
  const padTop = 10;
  const axisBand = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - axisBand;
  const totals = times.map((_, i) => (mode === "stacked" ? series.reduce((s, x) => s + x.values[i], 0) : Math.max(...series.map((x) => x.values[i]))));
  const max = niceMax(Math.max(...totals, maxValue ?? 0, 0));
  const band = plotW / n;
  const groupW = Math.min(mode === "stacked" ? 24 : 24 * series.length + 2 * (series.length - 1), band * 0.7);
  const barW = mode === "stacked" ? groupW : (groupW - 2 * (series.length - 1)) / series.length;
  const y = (v: number) => padTop + plotH - (v / max) * plotH;
  const baseline = y(0);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelIdx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [...Array(n).keys()];
  const r = Math.min(4, barW / 2);

  const topRounded = (x0: number, top: number, w: number, h: number) => {
    if (h <= 0) return "";
    const rr = Math.min(r, h);
    return `M ${x0} ${top + h} L ${x0} ${top + rr} Q ${x0} ${top} ${x0 + rr} ${top} L ${x0 + w - rr} ${top} Q ${x0 + w} ${top} ${x0 + w} ${top + rr} L ${x0 + w} ${top + h} Z`;
  };

  const tipLeft = hover !== null ? Math.min(Math.max(padLeft + band * hover + band / 2 + 12, 0), width - 170) : 0;

  return (
    <figure style={{ margin: 0 }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg width={width} height={height} role="img" aria-label={caption} style={{ display: "block" }} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={padLeft - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                {formatTick(t, unit)}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text key={i} x={padLeft + band * i + band / 2} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={AXIS_TEXT}>
              {dayLabel(times[i])}
            </text>
          ))}
          {times.map((t, i) => {
            const gx = padLeft + band * i + (band - groupW) / 2;
            const dim = hover !== null && hover !== i ? 0.45 : 1;
            let stackTop = baseline;
            const visible = series.map((s) => s.values[i] > 0);
            const lastVisible = visible.lastIndexOf(true);
            return (
              <g key={t} opacity={dim}>
                {series.map((s, si) => {
                  const v = s.values[i];
                  if (v <= 0) return null;
                  const h = (v / max) * plotH;
                  if (mode === "stacked") {
                    const top = stackTop - h;
                    const gap = si > 0 && stackTop !== baseline ? 2 : 0;
                    stackTop = top;
                    return si === lastVisible ? (
                      <path key={s.name} d={topRounded(gx, top, barW, h - gap)} fill={s.color} />
                    ) : (
                      <rect key={s.name} x={gx} y={top} width={barW} height={Math.max(0, h - gap)} fill={s.color} />
                    );
                  }
                  return <path key={s.name} d={topRounded(gx + si * (barW + 2), baseline - h, barW, h)} fill={s.color} />;
                })}
                <rect
                  x={padLeft + band * i}
                  y={padTop}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${dayLabel(t)} : ${series.map((s) => `${s.name} ${formatValue(s.values[i], unit)}`).join(", ")}`}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={hrefs?.[i] ? () => router.push(hrefs[i]!) : undefined}
                  onKeyDown={hrefs?.[i] ? (e) => e.key === "Enter" && router.push(hrefs[i]!) : undefined}
                  style={{ outline: "none", cursor: hrefs?.[i] ? "pointer" : undefined }}
                />
              </g>
            );
          })}
          <line x1={padLeft} x2={width - padRight} y1={baseline} y2={baseline} stroke="var(--color-neutral-400)" strokeWidth={1} />
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
                <strong style={{ whiteSpace: "nowrap" }}>{formatValue(s.values[hover], unit)}</strong>
                <span style={{ color: AXIS_TEXT }}>{s.name}</span>
              </div>
            ))}
            {notes?.[hover]?.map((line) => (
              <div key={line} style={{ color: AXIS_TEXT }}>
                {line}
              </div>
            ))}
            {hrefs?.[hover] && <div style={{ marginTop: 4, fontWeight: 700, color: "var(--color-accent-700)" }}>Cliquer pour le détail →</div>}
          </div>
        )}
      </div>
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 6, color: AXIS_TEXT, flexWrap: "wrap" }}>
          {series.map((s) => (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 10, height: 10, background: s.color, borderRadius: 2 }} />
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
                  <td>{hrefs?.[i] ? <Link href={hrefs[i]!}>{dayLabel(t)}</Link> : dayLabel(t)}</td>
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
