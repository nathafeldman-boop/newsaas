"use client";

import { useState } from "react";
import Link from "next/link";
import { ShareButtons } from "@/components/share/ShareButtons";
import { Seg } from "@/components/tools/Seg";
import { SITE_URL } from "@/lib/site";
import {
  AGE_LABEL,
  apprenticeSalary,
  formatEuros,
  formatPercent,
  internshipGratification,
  proContractSalary,
  type AgeBracket,
  type ContractYear,
  type ProLevel,
} from "@/lib/salary/legalRates";

type Contract = "apprentissage" | "pro" | "stage";

const CONTRACT_OPTIONS: { value: Contract; label: string }[] = [
  { value: "apprentissage", label: "Apprentissage" },
  { value: "pro", label: "Contrat pro" },
  { value: "stage", label: "Stage" },
];

const AGES = Object.keys(AGE_LABEL) as AgeBracket[];

// Valeurs par défaut = le cas le plus recherché (apprenti 18-20 ans, 1re
// année, contrat récent) : le résultat est donc déjà présent dans le HTML
// rendu côté serveur, lisible par Google sans exécuter de JavaScript.
export function SalarySimulator() {
  const [contract, setContract] = useState<Contract>("apprentissage");
  const [age, setAge] = useState<AgeBracket>("18to20");
  const [year, setYear] = useState<ContractYear>(1);
  const [recentContract, setRecentContract] = useState(true);
  const [proLevel, setProLevel] = useState<ProLevel>("bacProOrMore");
  const [weeklyHours, setWeeklyHours] = useState(35);

  const result =
    contract === "apprentissage"
      ? apprenticeSalary(age, year, recentContract)
      : contract === "pro"
        ? proContractSalary(age, proLevel)
        : internshipGratification(weeklyHours);

  return (
    <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
      <div className="grid gap-4">
        <div className="field">
          <label>Type de contrat</label>
          <Seg name="Type de contrat" options={CONTRACT_OPTIONS} value={contract} onChange={setContract} />
        </div>

        {contract !== "stage" && (
          <div className="field">
            <label htmlFor="sim-age">Ton âge</label>
            <select
              id="sim-age"
              className="input"
              value={age}
              onChange={(event) => setAge(event.target.value as AgeBracket)}
            >
              {AGES.filter((a) => contract === "apprentissage" || a !== "under18").map((a) => (
                <option key={a} value={a}>
                  {contract === "pro" && a === "18to20" ? "Moins de 21 ans" : AGE_LABEL[a]}
                </option>
              ))}
            </select>
          </div>
        )}

        {contract === "apprentissage" && (
          <>
            <div className="field">
              <label>Année du contrat</label>
              <Seg
                name="Année du contrat"
                options={[
                  { value: 1 as ContractYear, label: "1re année" },
                  { value: 2 as ContractYear, label: "2e année" },
                  { value: 3 as ContractYear, label: "3e année" },
                ]}
                value={year}
                onChange={setYear}
              />
            </div>
            <div className="field">
              <label>Contrat signé</label>
              <Seg
                name="Date de signature"
                options={[
                  { value: "recent", label: "Depuis le 1er mars 2025" },
                  { value: "old", label: "Avant" },
                ]}
                value={recentContract ? "recent" : "old"}
                onChange={(v) => setRecentContract(v === "recent")}
              />
            </div>
          </>
        )}

        {contract === "pro" && age !== "26plus" && (
          <div className="field">
            <label>Diplôme déjà obtenu</label>
            <Seg
              name="Diplôme"
              options={[
                { value: "bacProOrMore" as ProLevel, label: "Bac pro ou plus" },
                { value: "belowBacPro" as ProLevel, label: "Moins que le bac pro" },
              ]}
              value={proLevel}
              onChange={setProLevel}
            />
          </div>
        )}

        {contract === "stage" && (
          <div className="field">
            <label htmlFor="sim-hours">Heures par semaine</label>
            <input
              id="sim-hours"
              className="input"
              type="number"
              min={1}
              max={48}
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(Math.min(48, Math.max(1, Number(event.target.value) || 35)))}
            />
          </div>
        )}
      </div>

      <div
        aria-live="polite"
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: "var(--radius-md)",
          background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13 }}>
          {contract === "stage" ? "Gratification minimale" : "Salaire minimum"} par mois
          {result.rate !== null ? ` (${formatPercent(result.rate)} du SMIC)` : ""}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {formatEuros(result.gross)} <span style={{ fontSize: 15, fontWeight: 400 }}>brut</span>
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 16 }}>
          ≈ {formatEuros(Math.floor(result.netEstimate), 0)} <span style={{ fontSize: 13 }}>net estimé</span>
        </p>
        <p style={{ margin: "12px 0 0", fontSize: 13 }}>{result.explanation}</p>
      </div>

      <ShareButtons
        title="Partage ton résultat"
        url={`${SITE_URL}/outils/simulateur-salaire-alternance`}
        text={
          contract === "stage"
            ? `En stage je toucherai au moins ${formatEuros(result.gross, 0)} par mois 😮 Calcule ta gratification :`
            : `En ${contract === "pro" ? "contrat pro" : "alternance"} je toucherai au moins ${formatEuros(result.gross, 0)} brut par mois 😮 Calcule ton salaire :`
        }
      />

      <Link
        href={contract === "stage" ? "/offres/stage" : "/offres/alternance"}
        className="btn btn-primary btn-block"
        style={{ marginTop: 20 }}
      >
        {contract === "stage" ? "Voir les offres de stage" : "Voir les offres d'alternance"}
      </Link>
    </div>
  );
}
