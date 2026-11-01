"use client";

import { useState } from "react";

// Texte de la publication (modifiable), boutons Copier / Télécharger le visuel
// et enregistrement dans l'historique. Rien n'est envoyé à LinkedIn : on copie,
// on colle, on publie à la main.

const LINKEDIN_LIMIT = 3000;

type Props = {
  initialText: string;
  initialComment: string | null;
  kind: string;
  label: string;
  offerIds: string[];
  sector: string | null;
  city: string | null;
  visualSrc: string;
  /** Publication déjà dans l'historique : pas de bouton d'enregistrement. */
  saved: boolean;
  saveAction: (formData: FormData) => void | Promise<void>;
};

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Contexte non sécurisé ou autorisation refusée : repli sur la sélection.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <button
      type="button"
      className="btn btn-primary"
      style={{ fontSize: 13 }}
      onClick={async () => {
        setState((await copy(text)) ? "ok" : "fail");
        setTimeout(() => setState("idle"), 2200);
      }}
    >
      {state === "ok" ? "Copié ✓" : state === "fail" ? "Copie impossible : sélectionne le texte" : label}
    </button>
  );
}

export function PostEditor({ initialText, initialComment, kind, label, offerIds, sector, city, visualSrc, saved, saveAction }: Props) {
  const [text, setText] = useState(initialText);
  const [comment, setComment] = useState(initialComment ?? "");
  const tooLong = text.length > LINKEDIN_LIMIT;
  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "start" }}>
      <div className="flex flex-col gap-3">
        <label style={{ fontSize: 13, fontWeight: 700 }} htmlFor="linkedin-text">
          Texte de la publication
        </label>
        <textarea
          id="linkedin-text"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          style={{ width: "100%", fontSize: 14, lineHeight: 1.5, resize: "vertical" }}
        />
        <div style={{ fontSize: 12, color: tooLong ? "#c0392b" : "var(--color-neutral-600)" }}>
          {text.length.toLocaleString("fr-FR")} / {LINKEDIN_LIMIT.toLocaleString("fr-FR")} caractères{tooLong ? " : trop long pour LinkedIn" : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={text} label="Copier le texte" />
        </div>

        {initialComment !== null && (
          <>
            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }} htmlFor="linkedin-comment">
              Premier commentaire (les liens)
            </label>
            <textarea
              id="linkedin-comment"
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={9}
              style={{ width: "100%", fontSize: 13, lineHeight: 1.5, resize: "vertical" }}
            />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={comment} label="Copier le commentaire" />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div style={{ fontSize: 13, fontWeight: 700 }}>Visuel (1080 × 1350)</div>
        {/* eslint-disable-next-line @next/next/no-img-element -- image générée à la demande, réservée à l'admin */}
        <img
          src={visualSrc}
          alt="Aperçu du visuel de la publication"
          width={1080}
          height={1350}
          style={{ width: "100%", maxWidth: 380, height: "auto", borderRadius: 12, border: "1px solid var(--color-divider)" }}
        />
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-primary" style={{ fontSize: 13 }} href={`${visualSrc}&dl=1`} download>
            Télécharger le visuel
          </a>
        </div>

        {!saved && (
          <form action={saveAction} className="flex flex-col gap-2" style={{ marginTop: 8 }}>
            <input type="hidden" name="f" value={kind} />
            <input type="hidden" name="label" value={label} />
            <input type="hidden" name="ids" value={offerIds.join(",")} />
            {sector && <input type="hidden" name="s" value={sector} />}
            {city && <input type="hidden" name="v" value={city} />}
            <input type="hidden" name="text" value={text} />
            <input type="hidden" name="comment" value={initialComment === null ? "" : comment} />
            <button type="submit" className="btn btn-secondary" style={{ fontSize: 13 }} disabled={tooLong}>
              Enregistrer dans l&apos;historique
            </button>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-neutral-600)" }}>
              Enregistrer empêche de reproposer ces offres pendant 60 jours. Tu peux supprimer l&apos;entrée si tu ne publies finalement pas.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
