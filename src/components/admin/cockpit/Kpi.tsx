import type { ReactNode } from "react";

// Tuile d'indicateur : libellé, valeur, variation vs période précédente
// (flèche + texte, jamais la couleur seule) et définition dépliable avec sa
// source, pour qu'aucun chiffre ne soit lu sans savoir d'où il vient.
export function Kpi({
  label,
  value,
  sub,
  delta,
  goodWhen = "up",
  definition,
  source,
  hero = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: { text: string; direction: "up" | "down" | "flat" } | null;
  goodWhen?: "up" | "down" | "neutral";
  definition: string;
  source: string;
  hero?: boolean;
}) {
  const tone =
    !delta || delta.direction === "flat" || goodWhen === "neutral"
      ? "var(--color-neutral-600)"
      : (delta.direction === "up") === (goodWhen === "up")
        ? "#0c6b3c"
        : "#b42318";
  return (
    <div className={hero ? "cockpit-card cockpit-hero" : "cockpit-card"}>
      <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: hero ? 40 : 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, color: tone, marginTop: 4, fontWeight: 600 }}>
          <span aria-hidden>{delta.direction === "up" ? "▲ " : delta.direction === "down" ? "▼ " : ""}</span>
          {delta.text}
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 4 }}>{sub}</div>}
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 11.5, color: "var(--color-neutral-500)", cursor: "pointer" }}>Définition</summary>
        <p style={{ fontSize: 12, margin: "6px 0 0", color: "var(--color-neutral-700)", lineHeight: 1.45 }}>{definition}</p>
        <p style={{ fontSize: 11.5, margin: "4px 0 0", color: "var(--color-neutral-500)" }}>Source : {source}</p>
      </details>
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="cockpit-kpis">{children}</div>;
}

export function Section({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
        {actions}
      </div>
      {subtitle && <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "4px 0 0", maxWidth: "75ch" }}>{subtitle}</p>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="cockpit-card">
      {title && <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 10px" }}>{title}</h3>}
      {children}
    </div>
  );
}

export function Insufficient({ children = "Données insuffisantes" }: { children?: ReactNode }) {
  return <span style={{ fontSize: 14, color: "var(--color-neutral-500)", fontWeight: 600 }}>{children}</span>;
}
