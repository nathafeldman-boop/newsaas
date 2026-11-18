"use client";

import { useMemo, useState } from "react";
import { schoolStageLetter } from "@/lib/schoolStage/levels";
import type { SchoolCompany } from "@/lib/schoolStage/companies";
import type { SchoolStageLevel } from "@/types/database";

// Liste des entreprises proches + lettre de demande de stage (18/11). La
// lettre se met à jour avec l'entreprise choisie, l'établissement et les
// dates ; l'élève peut la retoucher, la copier ou l'imprimer pour la déposer.

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

export function SchoolLetter({ level, fullName, companies, zone }: { level: SchoolStageLevel; fullName: string | null; companies: SchoolCompany[]; zone: string }) {
  const [picked, setPicked] = useState<SchoolCompany>(companies[0]);
  const [school, setSchool] = useState("");
  const [dates, setDates] = useState("");
  const generated = useMemo(
    () => schoolStageLetter({ level, fullName, school, dates, company: picked.name, activity: picked.activity }),
    [level, fullName, school, dates, picked],
  );
  // Retouches de l'élève : gardées tant qu'il ne change pas d'entreprise.
  const [edited, setEdited] = useState<{ key: string; text: string } | null>(null);
  const key = `${picked.siret}|${school}|${dates}`;
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
    w.document.write(
      `<!doctype html><meta charset="utf-8"><title>Lettre ${esc(picked.name)}</title><body style="font:15px/1.6 Georgia,serif;max-width:640px;margin:48px auto;white-space:pre-wrap">${esc(
        `${picked.name}\n${picked.address}\n\n${letter}`,
      )}</body>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
        {companies.length} entreprise{companies.length > 1 ? "s" : ""} autour de {zone}
      </p>
      <div className="card elev-sm" style={{ padding: 6, maxHeight: 340, overflowY: "auto" }}>
        {companies.map((c) => (
          <button
            key={c.siret}
            type="button"
            onClick={() => setPicked(c)}
            className="flex w-full flex-col items-start text-left"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: picked.siret === c.siret ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
              border: 0,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>{c.name}</span>
            <span style={{ fontSize: 12.5, ...muted }}>
              {c.activity} · {c.address}
            </span>
          </button>
        ))}
      </div>

      <div className="card elev-sm flex flex-col gap-3" style={{ padding: 18 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>✍️ Ta lettre pour {picked.name}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Ton collège ou ton lycée" style={field} />
          <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Dates du stage (ex. 8 au 12 décembre)" style={field} />
        </div>
        <textarea
          value={letter}
          onChange={(e) => setEdited({ key, text: e.target.value })}
          rows={14}
          style={{ ...field, lineHeight: 1.5, resize: "vertical" }}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={copy}>
            {copied ? "✅ Copiée" : "Copier la lettre"}
          </button>
          <button type="button" className="btn" onClick={print}>
            🖨️ Imprimer pour la déposer
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, ...muted }}>
          Le plus efficace : passe la déposer en main propre avec ton CV, ou appelle pour demander à qui l&apos;envoyer. Adresse : {picked.address}.
        </p>
      </div>
    </div>
  );
}
