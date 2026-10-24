import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CountUp } from "@/components/admin/cockpit/CountUp";

// Tuile d'indicateur : libellé, valeur, variation vs période précédente
// (flèche + texte, jamais la couleur seule) et définition dépliable avec sa
// source, pour qu'aucun chiffre ne soit lu sans savoir d'où il vient.
// href : la tuile ouvre le détail du chiffre (25/10, Nathan : « quand je
// clique sur une data, je veux de la data sur cette data »). accent : liseré
// de couleur pour repérer les tuiles (décoratif, jamais porteur de sens
// seul). Une valeur numérique défile jusqu'à son chiffre.
export const KPI_ACCENTS = {
  green: "#0f9c56",
  blue: "#2a78d6",
  pink: "#e87ba4",
  amber: "#d98a00",
  violet: "#7c5cd6",
} as const;
export type KpiAccent = keyof typeof KPI_ACCENTS;

export function Kpi({
  label,
  value,
  sub,
  delta,
  goodWhen = "up",
  definition,
  source,
  hero = false,
  href,
  accent,
  live = false,
  cta = "Voir le détail",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: { text: string; direction: "up" | "down" | "flat" } | null;
  goodWhen?: "up" | "down" | "neutral";
  definition: string;
  source: string;
  hero?: boolean;
  href?: string;
  accent?: KpiAccent;
  // Point vert qui pulse : chiffre en direct.
  live?: boolean;
  cta?: string;
}) {
  const tone =
    !delta || delta.direction === "flat" || goodWhen === "neutral"
      ? "var(--color-neutral-600)"
      : (delta.direction === "up") === (goodWhen === "up")
        ? "#0c6b3c"
        : "#b42318";
  const body = (
    <>
      <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        {live && <span className="live-dot" aria-hidden />}
        {label}
      </div>
      <div style={{ fontSize: hero ? 40 : 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, color: tone, marginTop: 4, fontWeight: 600 }}>
          <span aria-hidden>{delta.direction === "up" ? "▲ " : delta.direction === "down" ? "▼ " : ""}</span>
          {delta.text}
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 4 }}>{sub}</div>}
      {href && <div className="cockpit-go">{cta} →</div>}
    </>
  );
  const style = accent ? ({ "--kpi-accent": KPI_ACCENTS[accent] } as CSSProperties) : undefined;
  return (
    <div className={`cockpit-card${hero ? " cockpit-hero" : ""}${href ? " is-link" : ""}${accent ? " has-accent" : ""}`} style={style}>
      {href ? (
        <Link href={href} className="cockpit-kpi-link">
          {body}
        </Link>
      ) : (
        body
      )}
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
