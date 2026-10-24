"use client";

import { useMemo, useState } from "react";
import {
  TEMPLATE_DOMAINS,
  TEMPLATE_STYLES,
  countPlaceholders,
  guessTemplateDomain,
  renderTemplate,
  type TemplateInput,
  type TemplateStyle,
} from "@/lib/coverLetter/templates";

// Bibliothèque de modèles (24/10) : domaine + style, trois champs
// facultatifs, aperçu en direct. « Utiliser ce modèle » remplace la lettre
// du panneau (qui reste modifiable) ; rien n'est inventé, ce qui manque
// reste entre crochets.

export type TemplateContext = {
  offer: TemplateInput["offer"] & { sector: string | null };
  profile: TemplateInput["profile"];
};

const muted = "color-mix(in srgb, var(--color-text) 60%, transparent)";

export function TemplateLetterPicker({
  context,
  onUse,
  onClose,
}: {
  context: TemplateContext;
  onUse: (letter: string, template: { domain: string; style: TemplateStyle }) => void;
  onClose: () => void;
}) {
  const [domain, setDomain] = useState(() => guessTemplateDomain(context.offer.sector, context.offer.title));
  const [style, setStyle] = useState<TemplateStyle>("classique");
  const [experience, setExperience] = useState("");
  const [whyCompany, setWhyCompany] = useState("");
  const [rhythm, setRhythm] = useState("");
  const [copied, setCopied] = useState(false);
  const alternance = context.offer.contractType === "alternance";

  const preview = useMemo(
    () => renderTemplate(domain, style, { offer: context.offer, profile: context.profile, answers: { experience, whyCompany, rhythm } }),
    [domain, style, context, experience, whyCompany, rhythm],
  );
  const missing = countPlaceholders(preview);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="card elev-sm" style={{ padding: 16, gap: 12, background: "var(--color-surface)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, margin: 0 }}>Modèles de lettres Stageio</p>
          <p style={{ fontSize: 12, color: muted, margin: "2px 0 0" }}>Rédigés à l&apos;avance, sans IA. Rien n&apos;est inventé : ce qui manque reste entre crochets.</p>
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost" style={{ fontSize: 12.5 }} aria-label="Fermer les modèles">
          Fermer
        </button>
      </div>

      <label className="flex flex-col gap-1" style={{ fontSize: 12.5, fontWeight: 600 }}>
        Domaine
        <select value={domain} onChange={(e) => setDomain(e.target.value)} className="input" style={{ fontSize: 13, fontWeight: 400 }}>
          {TEMPLATE_DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Style</span>
        <div className="seg" role="group" aria-label="Style de lettre" style={{ alignSelf: "flex-start" }}>
          {TEMPLATE_STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={`seg-opt${style === s.id ? " is-active" : ""}`} aria-pressed={style === s.id}>
              {s.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: muted }}>{TEMPLATE_STYLES.find((s) => s.id === style)?.hint}</span>
      </div>

      <details>
        <summary style={{ fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>Compléter les passages entre crochets (facultatif)</summary>
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={experience}
            maxLength={400}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Une expérience : « j'ai travaillé deux étés en boulangerie, au comptoir »"
            className="input"
            style={{ fontSize: 12.5 }}
          />
          <input
            type="text"
            value={whyCompany}
            maxLength={300}
            onChange={(e) => setWhyCompany(e.target.value)}
            placeholder={`Pourquoi ${context.offer.company || "cette entreprise"} : un produit, une valeur, un projet`}
            className="input"
            style={{ fontSize: 12.5 }}
          />
          {alternance && (
            <input
              type="text"
              value={rhythm}
              maxLength={120}
              onChange={(e) => setRhythm(e.target.value)}
              placeholder="Ton rythme : « 3 semaines en entreprise, 1 semaine en cours »"
              className="input"
              style={{ fontSize: 12.5 }}
            />
          )}
        </div>
      </details>

      <pre
        aria-label="Aperçu du modèle"
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          fontSize: 12.5,
          lineHeight: 1.55,
          margin: 0,
          padding: 12,
          maxHeight: 320,
          overflowY: "auto",
          borderRadius: 16,
          background: "var(--color-neutral-100)",
        }}
      >
        {preview}
      </pre>
      <p style={{ fontSize: 12, margin: 0, color: missing ? "var(--color-accent-700)" : "var(--color-accent-2-700)", fontWeight: 600 }}>
        {missing ? `${missing} passage${missing > 1 ? "s" : ""} entre crochets à remplacer avant d'envoyer.` : "Rien à compléter : relis-la et elle est prête."}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onUse(preview, { domain, style })} className="btn btn-primary" style={{ fontSize: 13 }}>
          Utiliser ce modèle
        </button>
        <button type="button" onClick={() => void copy()} className="btn btn-secondary" style={{ fontSize: 13 }}>
          {copied ? "Copiée ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
}
