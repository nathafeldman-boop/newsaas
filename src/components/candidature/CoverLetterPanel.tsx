"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { generateCoverLetterAction } from "@/app/(app)/candidature/[offerId]/actions";

type Status = "idle" | "loading" | "ready" | "premium_required" | "error";

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
  const [achievement, setAchievement] = useState("");
  const [whyCompany, setWhyCompany] = useState("");
  const triggered = useRef(false);

  async function generate(extra?: { achievement?: string; whyCompany?: string }) {
    setStatus("loading");
    setError(null);
    setCopied(false);
    const result = await generateCoverLetterAction(offerId, extra);
    if (result.status === "success") {
      setLetter(result.letter);
      setStatus("ready");
    } else if (result.status === "premium_required") {
      setStatus("premium_required");
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
    if (letter) {
      try {
        await navigator.clipboard.writeText(letter);
        setCopied(true);
      } catch {
        // best-effort : le clic reste utile même si le presse-papier est refusé
      }
    }
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  }

  // La candidature elle-même est déjà enregistrée côté serveur dès l'ouverture
  // de cette page (voir generateCoverLetterAction), indépendamment du succès
  // de la génération -- ne jamais bloquer l'accès au lien de candidature
  // externe à cause d'un échec de sauvegarde de la lettre. Seul le court
  // instant de chargement initial justifie de désactiver le bouton.
  const applyDisabled = status === "loading" && !letter;

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

        {status === "premium_required" && (
          <motion.div
            key="premium"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card elev-sm flex flex-col items-center gap-2"
            style={{ padding: 20, textAlign: "center" }}
          >
            <span aria-hidden style={{ fontSize: 22 }}>
              🔒
            </span>
            <p style={{ fontSize: 13, margin: 0 }}>
              La lettre de motivation personnalisée est réservée aux membres Premium.
            </p>
            <Link href="/premium" className="btn btn-gradient mt-2">
              Passer Premium
            </Link>
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
            <button type="button" onClick={() => generate()} className="btn btn-secondary mt-3">
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
              onClick={() => generate({ achievement, whyCompany })}
              className="btn btn-ghost"
              style={{ alignSelf: "flex-start" }}
            >
              ↻ Régénérer
            </button>

            <div className="card" style={{ padding: 12, marginTop: 4 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, margin: 0 }}>
                Envie d&apos;une lettre encore plus personnalisée ? (optionnel)
              </p>
              <input
                type="text"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="Une réalisation concrète à mettre en avant"
                className="input mt-2"
                style={{ fontSize: 12.5 }}
              />
              <input
                type="text"
                value={whyCompany}
                onChange={(e) => setWhyCompany(e.target.value)}
                placeholder="Pourquoi cette entreprise en particulier ?"
                className="input mt-2"
                style={{ fontSize: 12.5 }}
              />
              <button
                type="button"
                onClick={() => generate({ achievement, whyCompany })}
                disabled={!achievement.trim() && !whyCompany.trim()}
                className="btn btn-secondary mt-2"
                style={{ fontSize: 12.5 }}
              >
                Personnaliser ma lettre
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {applyUrl ? (
        <>
          <button
            type="button"
            onClick={handleApplyOnSite}
            disabled={applyDisabled}
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
            {status === "premium_required" || status === "error" || !letter
              ? "On ouvre la page de l'offre — pas de lettre à coller cette fois."
              : copied
                ? "Lettre copiée — colle-la sur le site qui vient de s'ouvrir pour finaliser."
                : "On copie ta lettre et on ouvre la page de l'offre : colle-la pour finaliser."}
          </p>
        </>
      ) : (
        status !== "loading" && (
          <p className="tag tag-accent-2" style={{ padding: "8px 14px", fontSize: 13, display: "block" }}>
            Ce recruteur n&apos;a pas de lien externe — ta candidature est enregistrée, on lui a
            noté ton intérêt.
          </p>
        )
      )}
    </div>
  );
}
