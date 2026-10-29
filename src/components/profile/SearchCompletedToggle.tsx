"use client";

import { useState, useTransition } from "react";
import { markSearchCompletedAction, resumeSearchAction } from "@/app/(app)/profil/search-actions";
import { ShareWin } from "@/components/referral/ShareWin";
import { SIGNED_VIA_STAGEIO } from "@/lib/referrals/share";

const REASONS = [
  SIGNED_VIA_STAGEIO,
  "Alternance trouvée ailleurs",
  "Recherche mise en pause",
];

// Point d'entrée pour clôturer la recherche (voir search-actions.ts) --
// volontairement discret sur /profil plutôt qu'une interruption forcée du
// deck, pour ne jamais donner l'impression que Stageio pousse l'utilisateur
// vers la sortie.
export function SearchCompletedToggle({
  completedAt,
  completedReason,
  shareText = null,
}: {
  completedAt: string | null;
  completedReason: string | null;
  /** Message de recommandation (lien de parrainage) montré après « trouvée via Stageio » (29/10). */
  shareText?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (completedAt) {
    const viaStageio = completedReason === SIGNED_VIA_STAGEIO && !!shareText;
    return (
      <div className="card" style={{ padding: viaStageio ? "var(--space-4)" : "var(--space-3) var(--space-4)" }}>
        <div className="flex flex-row items-center justify-between">
          <div>
            <span style={{ fontSize: 14 }}>🎉 Recherche clôturée</span>
            {completedReason && (
              <p style={{ fontSize: 12, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                {completedReason}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void resumeSearchAction())}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }}
          >
            Reprendre
          </button>
        </div>
        {viaStageio && (
          <div className="animate-in">
            <p style={{ fontSize: 13.5, fontWeight: 700, margin: "12px 0 0" }}>💚 Aide un pote qui cherche encore</p>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
              Envoie-lui ce message : il arrive sur Stageio avec ton lien.
            </p>
            <ShareWin kind="signe" message={shareText!} compact />
          </div>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card flex-row items-center justify-between no-underline"
        style={{ color: "inherit", padding: "var(--space-3) var(--space-4)", width: "100%", border: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
      >
        <span style={{ fontSize: 14 }}>🎉 J&apos;ai trouvé mon alternance</span>
        <span>→</span>
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: "var(--space-4)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Félicitations ! Une précision ?</p>
      <div className="flex flex-col gap-2">
        {REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void markSearchCompletedAction(reason))}
            className="btn btn-secondary"
            style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
          >
            {reason}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ marginTop: 10, background: "none", border: "none", padding: 0, fontSize: 12, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", cursor: "pointer" }}
      >
        Annuler
      </button>
    </div>
  );
}
