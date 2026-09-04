const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// SVG statique (Server Component) : pas de tooltip au survol, mais chaque
// barre porte déjà sa valeur en label direct -- suffisant pour un dashboard
// interne consulté par une poignée de personnes, pas un produit grand public.
export function WeekdayBarChart({ averages }: { averages: number[] }) {
  const max = Math.max(1, ...averages);
  const peakIndex = averages.indexOf(Math.max(...averages));
  const width = 560;
  const height = 160;
  const gap = 12;
  const barWidth = (width - gap * 6) / 7;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height + 34}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        role="img"
        aria-label="Visiteurs distincts par jour de semaine"
      >
        {averages.map((v, i) => {
          const barHeight = Math.max(2, (v / max) * height);
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          const isPeak = i === peakIndex && v > 0;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                style={{ fill: isPeak ? "var(--color-accent)" : "var(--color-accent-300)" }}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={11}
                style={{ fill: "var(--color-text)", fontFamily: "var(--font-heading)" }}
              >
                {v.toFixed(1)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height + 20}
                textAnchor="middle"
                fontSize={11}
                style={{ fill: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
              >
                {DAY_LABELS[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {max > 1 && (
        <p style={{ fontSize: 12, marginTop: 4, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Pic d&apos;affluence : {DAY_LABELS[peakIndex]}, en moyenne {averages[peakIndex].toFixed(1)} visiteurs
          distincts.
        </p>
      )}
    </div>
  );
}
