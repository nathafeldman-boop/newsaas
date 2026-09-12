"use client";

import { useState } from "react";

export function CvQuickSend({ cvSignedUrl }: { cvSignedUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!cvSignedUrl) {
    return (
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
        Ajoute d&apos;abord ton CV depuis{" "}
        <a href="/cv" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
          la page CV
        </a>{" "}
        pour pouvoir l&apos;envoyer directement.
      </p>
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cvSignedUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (permissions navigateur) : le lien reste
      // accessible via le bouton "Télécharger" juste à côté, rien de bloquant.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
        {copied ? "✓ Lien copié" : "🔗 Copier le lien de mon CV"}
      </button>
      <a href={cvSignedUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
        ⬇️ Télécharger
      </a>
    </div>
  );
}
