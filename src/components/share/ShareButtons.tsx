"use client";

import { useState } from "react";

// Partage en un geste (WhatsApp / partage natif du téléphone / copie du
// lien) : canal d'acquisition gratuit et automatique -- chaque étudiant qui
// envoie une offre ou son résultat de simulateur à ses potes ramène des
// visiteurs. Le lien partagé porte utm_source=partage, donc les visites et
// inscriptions générées apparaissent dans le tableau "par source" de l'admin.
export function ShareButtons({
  url,
  text,
  title = "Partager",
  compact = false,
}: {
  url: string;
  text: string;
  title?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const tagged = (medium: string) => {
    const link = new URL(url);
    link.searchParams.set("utm_source", "partage");
    link.searchParams.set("utm_medium", medium);
    return link.toString();
  };

  async function nativeShare() {
    const shareUrl = tagged("natif");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
        return;
      } catch {
        // Partage annulé par l'utilisateur : rien à faire.
        return;
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(tagged("copie"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (navigateur ancien) : on n'affiche rien.
    }
  }

  return (
    <div style={{ marginTop: compact ? 12 : 20 }}>
      {!compact && <p style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 8px" }}>{title}</p>}
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${tagged("whatsapp")}`)}`}
          target="_blank"
          rel="noopener nofollow"
          className="btn btn-secondary"
        >
          WhatsApp
        </a>
        <button type="button" className="btn btn-secondary" onClick={nativeShare}>
          Envoyer à un pote
        </button>
        <button type="button" className="btn btn-secondary" onClick={copy}>
          {copied ? "Lien copié !" : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}
