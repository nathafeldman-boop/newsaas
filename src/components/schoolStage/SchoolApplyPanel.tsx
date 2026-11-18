"use client";

import { useMemo, useState } from "react";
import { schoolStageLetter } from "@/lib/schoolStage/levels";
import type { SchoolStageLevel } from "@/types/database";

// Candidature à un stage scolaire (18/11). Offre 1élève1stage : la lettre
// prête, puis l'offre ouverte sur la plateforme de l'État où l'élève valide
// avec ÉduConnect (Stageio ne peut pas postuler à sa place). Entreprise de
// l'annuaire : la lettre à envoyer ou à déposer, avec l'adresse.

const muted = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;
const field = {
  width: "100%",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-divider)",
  padding: "9px 11px",
  fontSize: 14,
  fontFamily: "inherit",
  background: "var(--color-surface)",
} as const;

export function SchoolApplyPanel({
  level,
  fullName,
  company,
  activity,
  applyUrl,
  official,
  duration,
}: {
  level: SchoolStageLevel;
  fullName: string | null;
  company: string;
  activity: string | null;
  applyUrl: string | null;
  official: boolean;
  duration: string | null;
}) {
  const [school, setSchool] = useState("");
  const [dates, setDates] = useState(official && duration?.includes("du ") ? duration.slice(duration.indexOf("du ") + 3) : "");
  const generated = useMemo(() => schoolStageLetter({ level, fullName, school, dates, company, activity }), [level, fullName, school, dates, company, activity]);
  const [edited, setEdited] = useState<{ key: string; text: string } | null>(null);
  const key = `${school}|${dates}`;
  const letter = edited?.key === key ? edited.text : generated;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function print() {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Lettre ${esc(company)}</title><body style="font:15px/1.6 Georgia,serif;max-width:640px;margin:48px auto;white-space:pre-wrap">${esc(letter)}</body>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>✍️ Ta lettre pour {company}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Ton collège ou ton lycée" style={field} />
        <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Dates du stage" style={field} />
      </div>
      <textarea value={letter} onChange={(e) => setEdited({ key, text: e.target.value })} rows={13} style={{ ...field, lineHeight: 1.5, resize: "vertical" }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "✅ Copiée" : "Copier la lettre"}
        </button>
        <button type="button" className="btn" onClick={print}>
          🖨️ Imprimer
        </button>
      </div>
      {official && applyUrl ? (
        <>
          <a href={applyUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
            Postuler sur 1élève1stage →
          </a>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, ...muted }}>
            1élève1stage est la plateforme du ministère de l&apos;Éducation nationale : tu te connectes avec ton compte ÉduConnect (celui de ton
            établissement) et tu colles ta lettre dans le message de candidature.
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, ...muted }}>
          Cette entreprise n&apos;a pas publié d&apos;offre : le plus efficace est de passer déposer ta lettre en main propre, ou d&apos;appeler pour
          demander à qui l&apos;envoyer.
        </p>
      )}
    </div>
  );
}
