export function StackedBarChart({
  data,
}: {
  data: { label: string; gratuit: number; premium: number }[];
}) {
  const totals = data.map((d) => d.gratuit + d.premium);
  const max = Math.max(1, ...totals);
  const width = 560;
  const height = 160;
  const gap = data.length > 1 ? Math.min(6, 300 / data.length) : 0;
  const barWidth = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : width;
  // Au-delà d'une poignée de barres, afficher un label sous chacune devient
  // illisible (chevauchement) -- on n'en garde qu'une poignée, régulièrement
  // espacées, comme le fait n'importe quel axe de graphe temporel.
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  if (data.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
        Aucune inscription sur cette période.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4" style={{ fontSize: 12, marginBottom: 8 }}>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-neutral-300)", display: "inline-block" }}
          />
          Gratuit
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-accent)", display: "inline-block" }}
          />
          Premium
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        role="img"
        aria-label="Inscriptions dans le temps, gratuit vs premium"
      >
        {data.map((d, i) => {
          const x = i * (barWidth + gap);
          const premiumHeight = (d.premium / max) * height;
          const gratuitHeight = (d.gratuit / max) * height;
          const segmentGap = d.premium > 0 && d.gratuit > 0 ? 2 : 0;
          return (
            <g key={i}>
              {d.premium > 0 && (
                <rect
                  x={x}
                  y={height - premiumHeight}
                  width={barWidth}
                  height={premiumHeight}
                  rx={2}
                  style={{ fill: "var(--color-accent)" }}
                />
              )}
              {d.gratuit > 0 && (
                <rect
                  x={x}
                  y={height - premiumHeight - segmentGap - gratuitHeight}
                  width={barWidth}
                  height={gratuitHeight}
                  rx={2}
                  style={{ fill: "var(--color-neutral-300)" }}
                />
              )}
              {i % labelStep === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={height + 16}
                  textAnchor="middle"
                  fontSize={10}
                  style={{ fill: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
