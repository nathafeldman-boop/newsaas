"use client";

import { useState } from "react";

// Jauge « ton futur salaire » du paywall (Nathan, 12/11 : « tu mets 10 € mais
// tu touches 5 000 € à la fin, c'est un vrai investissement »). La personne
// choisit elle-même le salaire qu'elle vise : on ne promet aucun montant, on
// met seulement en face le prix mensuel de Premium et d'Auto. Le minimum de
// la jauge est le minimum légal du contrat cherché (lib/premium/painCopy.ts).

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export function SalaryGauge({
  min,
  legalMin,
  start,
  premiumMonthly,
  autoMonthly,
}: {
  min: number;
  legalMin: number;
  start: number;
  premiumMonthly: number;
  autoMonthly: number | null;
}) {
  const max = 5000;
  const [salary, setSalary] = useState(Math.min(max, Math.max(min, start)));
  const pct = (premiumMonthly / salary) * 100;
  const pctLabel = pct < 1 ? pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : Math.round(pct).toString();
  return (
    <div style={{ background: "var(--color-accent-100)", borderRadius: 14, padding: "12px 14px" }}>
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "var(--color-accent-700)" }}>💶 Glisse jusqu&apos;au salaire que tu vises</p>
      <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800 }}>
        {fmt(salary)} <span style={{ fontSize: 14, fontWeight: 600 }}>brut / mois</span>
      </p>
      <input
        type="range"
        min={min}
        max={max}
        step={50}
        value={salary}
        onChange={(e) => setSalary(Number(e.target.value))}
        aria-label="Salaire mensuel visé"
        style={{ width: "100%", accentColor: "#0c7a44", margin: "6px 0 2px" }}
      />
      <div className="flex justify-between" style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
        <span>minimum légal : {fmt(legalMin)}</span>
        <span>{fmt(max)}</span>
      </div>
      <div className="flex flex-col gap-1" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.4 }}>
        <p style={{ margin: 0 }}>
          Tu investis <strong>{fmt2(premiumMonthly)}/mois</strong> avec Premium pour viser <strong>{fmt(salary)}/mois</strong>, soit{" "}
          <strong>{pctLabel} %</strong> de ce salaire.
        </p>
        {autoMonthly !== null && (
          <p style={{ margin: 0 }}>
            Avec Auto (les candidatures partent toutes seules) : <strong>{fmt2(autoMonthly)}/mois</strong> pour viser{" "}
            <strong>{fmt(salary)}/mois</strong>.
          </p>
        )}
      </div>
    </div>
  );
}

function fmt2(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
