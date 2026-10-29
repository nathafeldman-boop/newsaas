"use client";

import { useState, useSyncExternalStore } from "react";
import { logWinShareAction } from "@/app/(app)/dashboard/share-actions";
import type { WinKind } from "@/lib/referrals/share";

// « Fais profiter un pote » (29/10) : au moment d'une victoire (entretien,
// contrat signé), un message prêt à envoyer avec le lien de parrainage.
// Partage natif du téléphone (WhatsApp, Snap, Insta, SMS…) quand il existe,
// sinon WhatsApp et copie.

export function ShareWin({ kind, message, compact = false }: { kind: WinKind; message: string; compact?: boolean }) {
  // Partage natif du téléphone : connu seulement dans le navigateur.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      await navigator.share({ text: message });
      void logWinShareAction(kind, "natif");
    } catch {
      // partage annulé
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      void logWinShareAction(kind, "copie");
    } catch {
      // presse-papiers indisponible
    }
  }

  return (
    <div style={{ marginTop: compact ? 10 : 12 }}>
      <p
        style={{
          margin: 0,
          padding: "10px 12px",
          borderRadius: 12,
          fontSize: 13,
          lineHeight: 1.5,
          background: "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))",
          border: "1px dashed color-mix(in srgb, var(--color-accent) 40%, transparent)",
        }}
      >
        {message}
      </p>
      <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
        {canShare && (
          <button type="button" onClick={share} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
            📤 Envoyer à un pote
          </button>
        )}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void logWinShareAction(kind, "whatsapp")}
          className={canShare ? "btn btn-secondary" : "btn btn-primary"}
          style={{ padding: "8px 14px", fontSize: 12.5 }}
        >
          WhatsApp
        </a>
        <button type="button" onClick={copy} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
          {copied ? "Copié !" : "Copier le message"}
        </button>
      </div>
    </div>
  );
}
