"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cacheCvTextAction } from "@/app/(app)/cv/actions";
import { useAutoApply, type ApplyTarget } from "@/components/swipe/AutoApply";

// Like en mode « Postuler directement » (14/10, demande de Nathan) : si le
// Gmail n'est pas connecté, on envoie tout de suite l'étudiant le connecter
// chez Google, puis on revient au swipe et la candidature repart. S'il
// refuse ou n'y arrive pas, on ne le renvoie plus chez Google : il le fera
// lui-même depuis son profil. Sans CV, on le lui demande ici même (il part
// en pièce jointe).

export type AutoApplySetup = {
  gmailConnected: boolean;
  hasCv: boolean;
  // Offre likée juste avant de partir chez Google, à reprendre au retour.
  resume: { offerId: string; company: string; gmail: string | null } | null;
};

const PROMPTED_KEY = "stageio_gmail_prompted";
// Un retour de Google ne se traite qu'une fois, même si le deck se remonte
// (changement de filtre Stage/Alternance).
const handledResumes = new Set<string>();
// CV ajouté depuis la fenêtre ci-dessous : vaut pour le reste de la visite,
// même si le deck se remonte avant le prochain chargement de la page.
let cvUploadedThisVisit = false;

function wasPrompted(): boolean {
  try {
    return localStorage.getItem(PROMPTED_KEY) === "1";
  } catch {
    return true;
  }
}

function markPrompted() {
  try {
    localStorage.setItem(PROMPTED_KEY, "1");
  } catch {
    // Stockage indisponible : wasPrompted() renvoie déjà true, pas de boucle.
  }
}

export function useApplyOnLike(setup: AutoApplySetup | undefined, userId: string) {
  const autoApply = useAutoApply();
  const gmailConnected = setup?.gmailConnected ?? false;
  const [hasCv, setHasCv] = useState((setup?.hasCv ?? false) || cvUploadedThisVisit);
  const [cvFor, setCvFor] = useState<ApplyTarget | null>(null);

  const proceed = useCallback(
    (offer: ApplyTarget, cvOk: boolean) => {
      if (gmailConnected && !cvOk) {
        setCvFor(offer);
        return;
      }
      void autoApply.start(offer);
    },
    [gmailConnected, autoApply],
  );

  const applyOnLike = useCallback(
    (offer: ApplyTarget) => {
      if (!gmailConnected && !wasPrompted()) {
        markPrompted();
        // Petit délai : laisse partir l'enregistrement du like avant de
        // quitter la page.
        setTimeout(() => {
          // Navigation complète (pas router.push) : la route redirige chez Google.
          window.location.href = `/api/gmail/connect?next=${encodeURIComponent(`/swipe?apply=${offer.id}`)}`;
        }, 600);
        return;
      }
      proceed(offer, hasCv);
    },
    [gmailConnected, hasCv, proceed],
  );

  useEffect(() => {
    const resume = setup?.resume;
    if (!resume || handledResumes.has(resume.offerId)) return;
    handledResumes.add(resume.offerId);
    window.history.replaceState(null, "", "/swipe");
    const offer = { id: resume.offerId, company: resume.company };
    if (resume.gmail === "connected" && gmailConnected) {
      // Retour de Google (adresse de la page) : reprendre la candidature
      // une seule fois, au montage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      proceed(offer, hasCv);
      return;
    }
    autoApply.notify({
      id: offer.id,
      title: "Gmail pas connecté",
      text: `Tu pourras le connecter plus tard depuis ton profil. Ta candidature à ${resume.company} se termine sur son site.`,
      href: `/candidature/${offer.id}?express=1&envoi=no_gmail`,
      hrefLabel: "Finir la candidature",
    });
    // Une seule fois au montage : c'est le retour de Google.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
