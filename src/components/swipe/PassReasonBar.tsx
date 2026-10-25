"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PASS_REASONS, type OfferTags, type PassReason } from "@/lib/matching/passReasons";

// « Pas pour toi ? » (25/10) : juste après un « passer », une barre discrète
// propose la raison en un geste. Elle disparaît seule au bout de quelques
// secondes ou au swipe suivant : rien n'est obligatoire.

const AUTO_HIDE_MS = 6000;

export function PassReasonBar({
  promptKey,
  tags,
  ack,
  showContract = true,
  onPick,
  onClose,
}: {
  /** Change à chaque nouveau « passer » (relance le minuteur). null : rien à montrer. */
  promptKey: string | null;
  tags: OfferTags | null;
  /** Message de confirmation après un choix (« 3 offres du même genre retirées »). */
  ack: string | null;
  /** Paquet avec stages ET alternances : la raison « contrat » a un sens. */
  showContract?: boolean;
  onPick: (reason: PassReason) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!promptKey && !ack) return;
    const timer = setTimeout(onClose, ack ? 2600 : AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [promptKey, ack, onClose]);

  const reasons: { reason: PassReason; label: string; icon: string }[] = [
    { reason: "loin", ...PASS_REASONS.loin },
    { reason: "metier", ...PASS_REASONS.metier },
    { reason: "niveau", ...PASS_REASONS.niveau },
    ...(showContract
      ? [
          {
            reason: "contrat" as const,
            icon: PASS_REASONS.contrat.icon,
            label: tags?.contract === "stage" ? "Je cherche une alternance" : "Je cherche un stage",
          },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      {(promptKey || ack) && (
        <motion.div
          key={ack ? "ack" : promptKey}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            x: "-50%",
            // En haut : jamais sur les boutons passer / liker du bas.
            top: "calc(10px + env(safe-area-inset-top))",
            zIndex: 40,
            width: "min(360px, calc(100vw - 24px))",
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            borderRadius: 16,
            boxShadow: "0 12px 28px rgba(16, 48, 56, 0.16)",
            padding: "10px 12px",
          }}
        >
          {ack ? (
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>✓ {ack}</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Pas pour toi ? Dis-nous pourquoi</span>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={onClose}
                  style={{ background: "none", border: "none", fontSize: 16, lineHeight: 1, cursor: "pointer", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {reasons.map((r) => (
                  <button
                    key={r.reason}
                    type="button"
                    onClick={() => onPick(r.reason)}
                    className="tag tag-neutral"
                    style={{ cursor: "pointer", border: "1px solid var(--color-divider)", fontSize: 12.5, padding: "6px 10px" }}
                  >
                    <span aria-hidden>{r.icon}</span> {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
