function niceRound(value: number): number {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

// Lissage simple par courbes de Bézier cubiques (point de contrôle au milieu
// de chaque segment) : pas une interpolation exacte, mais visuellement lisse
// et suffisant pour un graphe de tendance -- pas besoin d'une lib de charts
// pour ça.
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function LineAreaChart({
  data,
  total,
}: {
  data: { label: string; gratuit: number; premium: number }[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
        Aucune inscription sur cette période.
      </p>
    );
  }

  const width = 560;
  const height = 200;
  const padLeft = 8;
  const padBottom = 24;
  const plotWidth = width - padLeft;
  const plotHeight = height - padBottom;

  const maxRaw = Math.max(1, ...data.map((d) => Math.max(d.gratuit, d.premium)));
  const gridMax = niceRound(maxRaw);

  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const xFor = (i: number) => padLeft + i * stepX;
  const yFor = (v: number) => plotHeight - (v / gridMax) * plotHeight;

  const gratuitPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.gratuit) }));
  const premiumPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.premium) }));
  const gratuitLine = smoothPath(gratuitPoints);
  const premiumLine = smoothPath(premiumPoints);
  const lastX = xFor(data.length - 1);
  const gratuitArea = `${gratuitLine} L ${lastX} ${plotHeight} L ${padLeft} ${plotHeight} Z`;
  const premiumArea = `${premiumLine} L ${lastX} ${plotHeight} L ${padLeft} ${plotHeight} Z`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const last = data[data.length - 1];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4" style={{ fontSize: 12 }}>
          <span className="flex items-center gap-1.5">
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent-2)", display: "inline-block" }} />
            Gratuit
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
            Premium
          </span>
        </div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{total}</p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", marginTop: 14, overflow: "visible" }}
        role="img"
        aria-label="Inscriptions dans le temps, gratuit vs premium"
      >
        <line x1={padLeft} y1={0} x2={width} y2={0} style={{ stroke: "var(--color-divider)" }} strokeWidth={1} />
        <text x={0} y={-6} fontSize={11} style={{ fill: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
          {gridMax}
        </text>

        <path d={gratuitArea} style={{ fill: "var(--color-accent-2)", opacity: 0.14 }} />
        <path d={premiumArea} style={{ fill: "var(--color-accent)", opacity: 0.14 }} />

        <path d={gratuitLine} fill="none" style={{ stroke: "var(--color-accent-2)" }} strokeWidth={2} />
        <path d={premiumLine} fill="none" style={{ stroke: "var(--color-accent)" }} strokeWidth={2} />

        <circle cx={lastX} cy={yFor(last.gratuit)} r={3.5} style={{ fill: "var(--color-accent-2)" }} />
        <circle cx={lastX} cy={yFor(last.premium)} r={3.5} style={{ fill: "var(--color-accent)" }} />

        {data.map(
          (d, i) =>
            i % labelStep === 0 && (
              <text
                key={i}
                x={xFor(i)}
                y={plotHeight + 18}
                textAnchor="middle"
                fontSize={10}
                style={{ fill: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
              >
                {d.label}
              </text>
            ),
        )}
      </svg>

      <details className="mt-3">
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--color-accent-700)" }}>
          Voir en tableau
        </summary>
        <div className="mt-2" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "4px 8px 4px 0", fontWeight: 500 }}>Date</th>
                <th style={{ padding: "4px 8px", fontWeight: 500 }}>Gratuit</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "4px 8px 4px 0" }}>{d.label}</td>
                  <td style={{ padding: "4px 8px" }}>{d.gratuit}</td>
                  <td style={{ padding: "4px 0" }}>{d.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
