"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { SparkleBurst } from "@/components/fx/SparkleBurst";
import { COVER_LETTER_RESET } from "@/lib/coverLetter/stream";
import { prefersReducedMotion } from "@/lib/fx/events";
import { MarkSentControl } from "@/components/candidature/MarkSentControl";

// Lettre de motivation (refaite le 16/10, demande de Nathan : « plus rapide,
// animation refaite de A à Z, ultra stylée pour TikTok ») : la lettre arrive
// en direct (api/cover-letter) et s'écrit sous les yeux de l'étudiant, avec
// un bord en dégradé qui tourne, des étapes qui s'allument, une encre qui
// brille en bout de ligne et une gerbe d'étincelles quand elle est prête.

type Status = "writing" | "ready" | "premium_required" | "error";
type Extra = { achievement?: string; whyCompany?: string };

const STAGES = ["Lecture de l'offre", "Ton profil", "Écriture"];
// Longueur du bout de texte « encre fraîche » (dégradé lumineux).
const WET_INK = 26;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function CoverLetterPanel({
  userId,
  offerId,
  applyUrl,
  initialLetter,
  initialSentAt,
}: {
  userId: string;
  offerId: string;
  applyUrl: string | null;
  initialLetter: string | null;
  /** Date d'envoi confirmée par l'étudiant (null : pas encore envoyée). */
  initialSentAt: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialLetter ? "ready" : "writing");
  const [letter, setLetter] = useState(initialLetter ?? "");
  // Texte reçu du serveur, et nombre de caractères déjà affichés : l'écran
  // rattrape le flux à son rythme, même quand le texte arrive par paquets.
  const [target, setTarget] = useState("");
  const [shown, setShown] = useState(0);
  const [streamDone, setStreamDone] = useState(false);
  const [stage, setStage] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openedApply, setOpenedApply] = useState(false);
  const [achievement, setAchievement] = useState("");
  const [whyCompany, setWhyCompany] = useState("");
  const attemptCount = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const triggered = useRef(false);

  const generate = useCallback(
    async (extra?: Extra) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("writing");
      setTarget("");
      setShown(0);
      setStreamDone(false);
      setStage(0);
      setError(null);
      setCopied(false);

      let res: Response;
      try {
        res = await fetch(`/api/cover-letter/${offerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...extra, attempt: attemptCount.current }),
          signal: controller.signal,
        });
      } catch {
        if (controller.signal.aborted) return;
        setError("Connexion perdue pendant l'écriture de ta lettre.");
        setStatus("error");
        return;
      }
      attemptCount.current += 1;

      if (res.status === 402) {
        setStatus("premium_required");
        return;
      }
      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? "La lettre n'a pas pu être écrite.");
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          const reset = text.lastIndexOf(COVER_LETTER_RESET);
          if (reset >= 0) {
            text = text.slice(reset + 1);
            setShown(0);
          }
          setTarget(text);
        }
        text += decoder.decode();
      } catch {
        if (controller.signal.aborted) return;
        setError("Connexion perdue pendant l'écriture de ta lettre.");
        setStatus("error");
        return;
      }
      if (!text.trim()) {
        setError("La lettre n'a pas pu être écrite.");
        setStatus("error");
        return;
      }
      setTarget(text.trim());
      setStreamDone(true);
    },
    [offerId],
  );

  useEffect(() => {
    if (!initialLetter && !triggered.current) {
      triggered.current = true;
      void generate();
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Étapes qui s'allument avant les premiers mots.
  useEffect(() => {
    if (status !== "writing") return;
    const timers = [setTimeout(() => setStage((s) => Math.max(s, 1)), 600), setTimeout(() => setStage((s) => Math.max(s, 2)), 1300)];
    return () => timers.forEach(clearTimeout);
  }, [status, celebrate]);

  // L'écran rattrape le texte reçu : vite quand il a du retard, lettre par
  // lettre quand il est à jour (effet machine à écrire).
  useEffect(() => {
    if (status !== "writing") return;
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(target.length);
      return;
    }
    if (shown >= target.length) return;
    const frame = requestAnimationFrame(() => {
      setShown((s) => Math.min(target.length, s + Math.max(1, Math.ceil((target.length - s) / 7))));
    });
    return () => cancelAnimationFrame(frame);
  }, [status, shown, target]);

  // Fin : tout est reçu et affiché -> lettre prête, étincelles.
  useEffect(() => {
    if (status === "writing" && streamDone && shown >= target.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLetter(target);
      setStatus("ready");
      setCelebrate((n) => n + 1);
    }
  }, [status, streamDone, shown, target]);

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
    setOpenedApply(true);
  }

  const visible = target.slice(0, shown);
  const dry = visible.slice(0, Math.max(0, visible.length - WET_INK));
  const wet = visible.slice(dry.length);
  const words = countWords(status === "ready" ? letter : visible);
  const activeStage = visible ? 2 : stage;

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
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
        {(status === "writing" || status === "ready") && words > 0 && (
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="tag tag-accent"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {words} mots
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "writing" && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            style={{ position: "relative", borderRadius: 26, padding: 2, overflow: "hidden" }}
          >
            {/* Bord en dégradé qui tourne */}
            <span
              aria-hidden
              className="fx-spin"
              style={{
                position: "absolute",
                inset: "-150%",
                background:
                  "conic-gradient(from 0deg, transparent 0deg, #3ee08f 60deg, var(--color-accent-2) 120deg, transparent 180deg, #ffd84d 250deg, transparent 300deg)",
              }}
            />
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                background: "var(--color-neutral-100)",
                padding: "16px 16px 18px",
                minHeight: 230,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="fx-orb"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "conic-gradient(from 90deg, #3ee08f, var(--color-accent-2), #ffd84d, #3ee08f)",
                    boxShadow: "0 0 18px color-mix(in srgb, var(--color-accent) 45%, transparent)",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, margin: 0 }}>Ta lettre s&apos;écrit…</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {STAGES.map((label, i) => (
                      <motion.span
                        key={label}
                        animate={{
                          opacity: i <= activeStage ? 1 : 0.35,
                          scale: i === activeStage ? [1, 1.08, 1] : 1,
                        }}
                        transition={{ duration: 0.5 }}
                        className={i <= activeStage ? "tag tag-accent" : "tag tag-neutral"}
                        style={{ fontSize: 10.5, padding: "2px 8px" }}
                      >
                        {i < activeStage ? "✓ " : ""}
                        {label}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {visible ? (
                <p
                  aria-live="polite"
                  style={{ margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {dry}
                  <span
                    style={{
                      background: "linear-gradient(90deg, var(--color-text), var(--color-accent) 55%, #3ee08f)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      textShadow: "0 0 18px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                    }}
                  >
                    {wet}
                  </span>
                  <span
                    aria-hidden
                    className="fx-caret"
                    style={{
                      display: "inline-block",
                      width: 2.5,
                      height: "1.1em",
                      marginLeft: 2,
                      verticalAlign: "-0.18em",
                      borderRadius: 2,
                      background: "var(--color-accent)",
                      boxShadow: "0 0 10px var(--color-accent)",
                    }}
                  />
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-2.5" aria-label="Écriture en cours">
                  {[96, 88, 92, 64].map((width, i) => (
                    <motion.span
                      key={i}
                      className="fx-shimmer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      style={{ display: "block", height: 11, width: `${width}%`, borderRadius: 999 }}
                    />
                  ))}
                </div>
              )}
            </div>
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
              Candidater (et la lettre de motivation personnalisée qui va avec) est réservé aux membres Premium.
            </p>
            <PremiumCtaLink userId={userId} source="cover_letter" className="btn btn-gradient mt-2">
              Passer Premium
            </PremiumCtaLink>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="card elev-sm"
            style={{ padding: 16, fontSize: 13, color: "var(--color-accent-700)" }}
          >
            {error}
            <button type="button" onClick={() => void generate()} className="btn btn-secondary mt-3">
              Réessayer
            </button>
          </motion.div>
        )}

        {status === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="flex flex-col gap-2"
          >
            <div style={{ position: "relative" }}>
              {celebrate > 0 && <SparkleBurst key={celebrate} count={20} spread={170} />}
              <motion.div
                key={`flash-${celebrate}`}
                initial={celebrate > 0 ? { boxShadow: "0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent)" } : false}
                animate={{ boxShadow: "0 0 0 14px color-mix(in srgb, var(--color-accent) 0%, transparent)" }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ borderRadius: 26 }}
              >
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={10}
                  className="input"
                  aria-label="Ta lettre de motivation"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    borderRadius: 24,
                    padding: "14px 16px",
                    border: "2px solid color-mix(in srgb, var(--color-accent) 45%, transparent)",
                    background: "var(--color-neutral-100)",
                  }}
                />
              </motion.div>
              {celebrate > 0 && (
                <motion.span
                  key={`ready-${celebrate}`}
                  initial={{ scale: 0, rotate: -12, opacity: 0 }}
                  animate={{ scale: [0, 1.25, 1], rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="tag"
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 14,
                    background: "linear-gradient(135deg, #3ee08f, var(--color-accent))",
                    color: "#fff",
                    fontWeight: 800,
                    boxShadow: "0 6px 16px color-mix(in srgb, var(--color-accent) 40%, transparent)",
                  }}
                >
                  ✓ Lettre prête
                </motion.span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void generate({ achievement, whyCompany })}
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
                onClick={() => void generate({ achievement, whyCompany })}
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

      {/* La candidature est enregistrée côté serveur (« à envoyer ») dès
          l'ouverture de la page pour un compte Premium, que la lettre
          aboutisse ou non : le lien externe n'est jamais bloqué par un échec
          de la lettre. Elle passe « envoyée » quand l'étudiant le confirme. */}
      {status !== "premium_required" &&
        (applyUrl ? (
          <>
            <button
              type="button"
              onClick={handleApplyOnSite}
              disabled={status === "writing"}
              className={status === "ready" ? "btn btn-primary btn-block fx-shine" : "btn btn-primary btn-block"}
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
              {status === "writing"
                ? "Ta lettre s'écrit, le bouton s'active dans un instant."
                : status === "error" || !letter
                  ? "On ouvre la page de l'offre — pas de lettre à coller cette fois."
                  : copied
                    ? "Lettre copiée — colle-la sur le site qui vient de s'ouvrir pour finaliser."
                    : "On copie ta lettre et on ouvre la page de l'offre : colle-la pour finaliser."}
            </p>
            {status !== "writing" && <MarkSentControl offerId={offerId} initialSentAt={initialSentAt} emphasize={openedApply} />}
          </>
        ) : (
          status !== "writing" && (
            <>
              <p className="tag tag-accent-2" style={{ padding: "8px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
                Pas de lien de candidature sur cette annonce : envoie ta lettre directement à l&apos;entreprise (site carrières, e-mail ou LinkedIn),
                puis indique-le ci-dessous pour la suivre.
              </p>
              <MarkSentControl offerId={offerId} initialSentAt={initialSentAt} emphasize={false} />
            </>
          )
        ))}
    </div>
  );
}
