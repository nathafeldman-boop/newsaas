"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/(app)/profil/delete-account-actions";

const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountPanel({ hasSubscription, error }: { hasSubscription: boolean; error?: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  return (
    <div
      className="mt-5"
      style={{
        borderRadius: "calc(var(--radius-lg) * 1.15)",
        border: "1px dashed color-mix(in srgb, var(--color-text) 25%, transparent)",
        padding: "var(--space-4) var(--space-5)",
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Zone de suppression</p>
      <p style={{ fontSize: 12.5, margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
        Supprime ton compte et toutes tes données (profil, candidatures, CV, favoris)
        de façon définitive et immédiate. Voir la{" "}
        <a href="/legal/confidentialite">politique de confidentialité</a> pour le détail.
      </p>

      {error === "delete_failed" && (
        <p style={{ fontSize: 12.5, margin: "10px 0 0", color: "var(--color-accent-700)" }}>
          La suppression a échoué. Réessaie, ou contacte contact@stageio.fr si ça persiste.
        </p>
      )}
      {error === "delete_confirmation" && (
        <p style={{ fontSize: 12.5, margin: "10px 0 0", color: "var(--color-accent-700)" }}>
          Il faut recopier exactement &laquo;&nbsp;{CONFIRM_WORD}&nbsp;&raquo; pour confirmer.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-secondary mt-3"
          style={{ whiteSpace: "nowrap" }}
        >
          Supprimer mon compte
        </button>
      ) : (
        <form action={deleteAccountAction} className="mt-3 flex flex-col gap-2.5">
          <p style={{ fontSize: 12.5, margin: 0, fontWeight: 600 }}>
            Cette action est irréversible.
            {hasSubscription && " Ton abonnement Premium sera aussi résilié immédiatement."}
          </p>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Recopie &laquo;&nbsp;{CONFIRM_WORD}&nbsp;&raquo; pour confirmer
          </label>
          <input
            type="text"
            name="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-divider)",
              fontSize: 13.5,
              background: "var(--color-neutral-100)",
            }}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              disabled={confirmation !== CONFIRM_WORD}
              className="btn btn-secondary"
              style={{ whiteSpace: "nowrap", opacity: confirmation === CONFIRM_WORD ? 1 : 0.4 }}
            >
              Supprimer définitivement
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
              }}
              className="btn"
              style={{ whiteSpace: "nowrap" }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
