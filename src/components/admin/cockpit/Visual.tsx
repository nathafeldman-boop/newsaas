import Link from "next/link";
import type { ReactNode } from "react";

// Petites pièces visuelles du cockpit (25/10, Nathan : « coloré, intuitif,
// que mon cerveau n'ait pas à réfléchir ») : avatar, pastilles, barres
// horizontales cliquables, étapes d'un parcours, histogramme. Le texte reste
// dans les couleurs d'écriture ; la couleur sert au repérage, jamais seule.

const AVATAR_COLORS = ["#0f9c56", "#2a78d6", "#e87ba4", "#d98a00", "#7c5cd6", "#0b8a9c"];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, seed, size = 36 }: { name: string; seed: string; size?: number }) {
  const color = AVATAR_COLORS[hash(seed) % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `color-mix(in srgb, ${color} 16%, white)`,
        color,
        border: `1.5px solid color-mix(in srgb, ${color} 45%, white)`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export function Chip({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "blue" | "violet"; children: ReactNode }) {
  const tones = {
    neutral: { bg: "var(--color-neutral-200)", fg: "var(--color-neutral-800)" },
    good: { bg: "#e3f4ea", fg: "#0c6b3c" },
    warn: { bg: "#fff4d6", fg: "#7a5200" },
    bad: { bg: "#fde7e7", fg: "#a12121" },
    blue: { bg: "#e4eefb", fg: "#1d5aa6" },
    violet: { bg: "#efe9fb", fg: "#5a3fb0" },
  }[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: tones.bg, color: tones.fg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/** Barres horizontales triées, chaque ligne cliquable si href. */
export function HBars({
  items,
  color = "#0f9c56",
  unit = "",
  empty = "Rien pour l'instant",
}: {
  items: { label: ReactNode; value: number; href?: string; note?: ReactNode }[];
  color?: string;
  unit?: string;
  empty?: string;
}) {
  if (items.length === 0) return <p style={{ fontSize: 13, color: "var(--color-neutral-500)", margin: 0 }}>{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => {
        const row = (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                {item.value.toLocaleString("fr-FR")}
                {unit}
                {item.note && <span style={{ color: "var(--color-neutral-600)", marginLeft: 6 }}>{item.note}</span>}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--color-neutral-200)", marginTop: 4, overflow: "hidden" }}>
              <div className="hbar-fill" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, height: 8, borderRadius: 4, background: color, animationDelay: `${i * 40}ms` }} />
            </div>
          </>
        );
        return item.href ? (
          <Link key={i} href={item.href} className="cockpit-hbar-link">
            {row}
          </Link>
        ) : (
          <div key={i}>{row}</div>
        );
      })}
    </div>
  );
}

export type Step = { label: string; done: boolean; at?: string | null; detail?: ReactNode };

/** Étapes d'un parcours, cochées ou non, avec la date et le temps écoulé depuis l'étape d'avant. */
export function Steps({ steps, formatDate, gap }: { steps: Step[]; formatDate: (iso: string) => string; gap: (fromIso: string, toIso: string) => string }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
      {steps.map((s, i) => {
        const prev = steps.slice(0, i).reverse().find((p) => p.done && p.at)?.at;
        return (
          <li
            key={s.label}
            className="cockpit-card"
            style={{
              padding: "10px 12px",
              borderTop: `3px solid ${s.done ? "#0f9c56" : "var(--color-neutral-300)"}`,
              opacity: s.done ? 1 : 0.75,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  background: s.done ? "#0f9c56" : "var(--color-neutral-200)",
                  color: s.done ? "#fff" : "var(--color-neutral-600)",
                }}
              >
                {s.done ? "✓" : i + 1}
              </span>
              {s.label}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: "var(--color-neutral-700)" }}>
              {s.done ? (s.at ? formatDate(s.at) : "oui") : "pas encore"}
            </div>
            {s.done && s.at && prev && <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}>{gap(prev, s.at)} après l&apos;étape d&apos;avant</div>}
            {s.detail && <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 2 }}>{s.detail}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/** Histogramme compact (heures d'une journée, jours récents). */
export function MiniHistogram({ values, labels, color = "#2a78d6", height = 90, title }: { values: number[]; labels: string[]; color?: string; height?: number; title: string }) {
  const max = Math.max(...values, 1);
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={title} style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
        {values.map((v, i) => (
          <div key={i} title={`${labels[i]} : ${v.toLocaleString("fr-FR")}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
            <div
              className="vbar-fill"
              style={{
                height: `${v === 0 ? 0 : Math.max(4, (v / max) * 100)}%`,
                background: color,
                borderRadius: "4px 4px 0 0",
                animationDelay: `${i * 15}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: 1, minWidth: 0, fontSize: 10, color: "var(--color-neutral-500)", textAlign: "center", overflow: "hidden" }}>
            {i % Math.ceil(labels.length / 8) === 0 ? l : ""}
          </span>
        ))}
      </div>
      <details style={{ marginTop: 6 }}>
        <summary style={{ fontSize: 11.5, color: "var(--color-neutral-500)", cursor: "pointer" }}>Voir le tableau</summary>
        <table className="cockpit-table" style={{ marginTop: 6 }}>
          <tbody>
            {values.map((v, i) => (
              <tr key={i}>
                <td>{labels[i]}</td>
                <td>{v.toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
