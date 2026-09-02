"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateCoverLetterAction } from "@/app/(app)/candidature/[offerId]/actions";

type Status = "idle" | "loading" | "ready" | "error";

export function CoverLetterPanel({
  offerId,
  applyUrl,
  initialLetter,
}: {
  offerId: string;
  applyUrl: string | null;
  initialLetter: string | null;
}) {
  const [letter, setLetter] = useState(initialLetter ?? "");
  const [status, setStatus] = useState<Status>(initialLetter ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const triggered = useRef(false);

  async function generate() {
    setStatus("loading");
    setError(null);
    setCopied(false);
    const result = await generateCoverLetterAction(offerId);
    if (result.status === "success") {
      setLetter(result.letter);
      setStatus("ready");
    } else {
      setError(result.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!initialLetter && !triggered.current) {
      triggered.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApplyOnSite() {
    if (!applyUrl) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
    } catch {
      // best-effort : le clic reste utile même si le presse-papier est refusé
    }
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          margin: 0,
        }}
      >
        Ta lettre pour cette offre
      </p>

      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card elev-sm"
            style={{ padding: 18, textAlign: "center", fontSize: 13 }}
          >
            ✨ Génération de ta lettre personnalisée...
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card elev-sm"
            style={{ padding: 16, fontSize: 13, color: "var(--color-accent-700)" }}
          >
            {error}
            <button type="button" onClick={generate} className="btn btn-secondary mt-3">
              Réessayer
            </button>
          </motion.div>
        )}

        {status === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={9}
              className="input"
              style={{ fontSize: 13, lineHeight: 1.5 }}
            />
            <button
              type="button"
              onClick={generate}
              className="btn btn-ghost"
              style={{ alignSelf: "flex-start" }}
            >
              ↻ Régénérer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {applyUrl ? (
        <>
          <button
            type="button"
            onClick={handleApplyOnSite}
            disabled={status !== "ready"}
            className="btn btn-primary btn-block"
          >
            Postuler sur le site ↗
          </button>
          <p
            style={{
              fontSize: 11,
              textAlign: "center",
              margin: 0,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            {copied
              ? "Lettre copiée — colle-la sur le site qui vient de s'ouvrir pour finaliser."
              : "On copie ta lettre et on ouvre la page de l'offre : colle-la pour finaliser."}
          </p>
        </>
      ) : (
        status === "ready" && (
          <p className="tag tag-accent-2" style={{ padding: "8px 14px", fontSize: 13, display: "block" }}>
            Ce recruteur n&apos;a pas de lien externe — ta candidature et ta lettre sont
            enregistrées, on lui a noté ton intérêt.
          </p>
        )
      )}
    </div>
  );
}
