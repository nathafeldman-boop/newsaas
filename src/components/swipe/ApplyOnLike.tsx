"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cacheCvTextAction } from "@/app/(app)/cv/actions";
import { useAutoApply, type ApplyTarget } from "@/components/swipe/AutoApply";

// Like en mode « Postuler directement » : la candidature part de l'adresse
// Stageio de l'étudiant quand l'entreprise a publié un email (voir
// api/applications/auto-send). Sans CV, on le lui demande ici même, une
// fois par visite (il part en pièce jointe).

export type AutoApplySetup = { hasCv: boolean };

// CV ajouté ou refusé depuis la fenêtre ci-dessous : vaut pour le reste de
// la visite, même si le deck se remonte (changement de filtre).
let cvUploadedThisVisit = false;
let cvDeclinedThisVisit = false;

export function useApplyOnLike(setup: AutoApplySetup | undefined, userId: string) {
  const autoApply = useAutoApply();
  const [hasCv, setHasCv] = useState((setup?.hasCv ?? false) || cvUploadedThisVisit);
  const [cvFor, setCvFor] = useState<ApplyTarget | null>(null);

  const applyOnLike = useCallback(
    (offer: ApplyTarget) => {
      if (!hasCv && !cvDeclinedThisVisit) {
        setCvFor(offer);
        return;
      }
      void autoApply.start(offer);
    },
    [hasCv, autoApply],
  );

  const ui = (
    <>
      {autoApply.toasts}
      <CvPromptSheet
        offer={cvFor}
        userId={userId}
        onDone={(uploaded) => {
          const offer = cvFor;
          setCvFor(null);
          if (uploaded) {
            cvUploadedThisVisit = true;
            setHasCv(true);
          } else {
            cvDeclinedThisVisit = true;
          }
          if (offer) void autoApply.start(offer);
        }}
      />
    </>
  );

  return { applyOnLike, ui };
}

function CvPromptSheet({
  offer,
  userId,
  onDone,
}: {
  offer: ApplyTarget | null;
  userId: string;
  onDone: (uploaded: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/cv-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });
    if (uploadError) {
      setSaving(false);
      setError("Le CV n'a pas pu être envoyé, réessaie.");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cv_path: path, cv_uploaded_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError("Le CV n'a pas pu être enregistré, réessaie.");
      return;
    }
    setFile(null);
    void cacheCvTextAction();
    onDone(true);
  }

  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          key="cv-prompt"
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 60, background: "rgba(10, 20, 18, 0.45)", padding: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-prompt-title"
            className="card elev-lg w-full max-w-sm"
            style={{ padding: "22px 20px" }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <p id="cv-prompt-title" style={{ fontFamily: "var(--font-heading)", fontSize: 19, margin: 0 }}>
              Ajoute ton CV
            </p>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}>
              Il part en pièce jointe de ta candidature à {offer.company}, et des suivantes. PDF ou Word (.docx).
            </p>
            <label
              className="mt-4 flex cursor-pointer items-center justify-center text-center"
              style={{ border: "2px dashed var(--color-divider)", borderRadius: "var(--radius-lg)", padding: "18px 14px", fontSize: 13 }}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? file.name : "Choisir mon CV"}
            </label>
            {error && <p style={{ fontSize: 13, margin: "10px 0 0", color: "var(--color-accent-700)" }}>{error}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="btn btn-primary btn-block" disabled={!file || saving} onClick={() => void upload()}>
                {saving ? "Envoi du CV…" : "Envoyer ma candidature"}
              </button>
              <button type="button" className="btn btn-secondary btn-block" disabled={saving} onClick={() => onDone(false)}>
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
