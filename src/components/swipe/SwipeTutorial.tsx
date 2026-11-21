"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Mini tuto à l'arrivée sur le swipe (21/11, Nathan) : écran assombri,
// zoom sur le cœur (like offert), l'offre file dans les favoris avec un +1,
// puis zoom sur la croix, et « Voilà, tu peux enfin trouver ton job ».
// Le like du tuto est enregistré, mais il faut Premium pour ouvrir ses
// favoris (règle en base : un seul like pour un compte gratuit).

export type TutoStep = "like" | "fly" | "pass" | "done";

type Rect = { x: number; y: number; w: number; h: number };

function rectOf(selector: string): Rect | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const el = els.find((e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function useRect(selector: string, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    // Bouton sous l'écran (téléphone) : on le ramène au milieu avant d'éclairer.
    const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((e) => e.offsetParent !== null);
    const r = el?.getBoundingClientRect();
    if (el && r && (r.top < 80 || r.bottom > window.innerHeight - 90)) el.scrollIntoView({ block: "center", behavior: "instant" });
    const update = () => setRect(rectOf(selector));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const t = window.setInterval(update, 400);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(t);
    };
  }, [selector, active]);
  return rect;
}

function Spotlight({ rect, onTap, label, text, hint }: { rect: Rect; onTap: () => void; label: string; text: string; hint: string }) {
  const pad = 14;
  const size = Math.max(rect.w, rect.h) + pad * 2;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const above = cy > 260;
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 2.4 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: "fixed",
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          boxShadow: "0 0 0 9999px rgba(6, 14, 10, 0.78), 0 0 40px 10px rgba(255,255,255,0.35)",
          pointerEvents: "none",
          zIndex: 91,
        }}
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0, 0.9] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ position: "fixed", left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: "50%", border: "3px solid #fff", pointerEvents: "none", zIndex: 92 }}
      />
      <button
        type="button"
        aria-label={label}
        onClick={onTap}
        style={{ position: "fixed", left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: "50%", background: "transparent", border: 0, cursor: "pointer", zIndex: 93 }}
      />
      <motion.div
        role="status"
        initial={{ opacity: 0, y: above ? 12 : -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          margin: "0 auto",
          maxWidth: 360,
          ...(above ? { bottom: window.innerHeight - (cy - size / 2) + 18 } : { top: cy + size / 2 + 18 }),
          background: "#fff",
          color: "#0d1b14",
          borderRadius: 18,
          padding: "14px 16px",
          boxShadow: "0 18px 40px rgba(0,0,0,.35)",
          zIndex: 93,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{text}</p>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.4, color: "#4b5a52" }}>{hint}</p>
      </motion.div>
    </>
  );
}

export function SwipeTutorial({
  step,
  flyTitle,
  onLike,
  onPass,
  onFlown,
  onDone,
}: {
  step: TutoStep | null;
  flyTitle: string | null;
  onLike: () => void;
  onPass: () => void;
  onFlown: () => void;
  onDone: () => void;
}) {
  // Rendu côté navigateur seulement (tailles d'écran, positions des boutons).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const like = useRect('[data-tuto="like"]', step === "like");
  const pass = useRect('[data-tuto="pass"]', step === "pass");
  const tab = useRect('[data-tuto="favoris"]', step === "fly");

  // Bloque le défilement pendant le tuto.
  useEffect(() => {
    if (!step) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [step]);

  // Le +1 reste visible un instant, puis la croix.
  useEffect(() => {
    if (step !== "fly") return;
    const t = window.setTimeout(onFlown, 2300);
    return () => window.clearTimeout(t);
  }, [step, onFlown]);

  if (!step || !mounted) return null;
  const target = tab ?? { x: window.innerWidth - 60, y: 16, w: 40, h: 40 };
  const startX = window.innerWidth / 2 - 90;
  const startY = window.innerHeight / 2 - 60;

  return (
    <div role="dialog" aria-modal="true" aria-label="Tuto du swipe" style={{ position: "fixed", inset: 0, zIndex: 90 }}>
      {/* Bloque les autres clics : seul le bouton éclairé répond. */}
      <div style={{ position: "fixed", inset: 0, background: step === "fly" || step === "done" ? "rgba(6,14,10,.78)" : "transparent", zIndex: 90 }} />
      <AnimatePresence>
        {step === "like" && like && (
          <Spotlight
            key="like"
            rect={like}
            onTap={onLike}
            label="Aimer"
            text="Tape ♥ quand une offre te plaît"
            hint="(ou glisse la carte à droite) Elle part dans tes candidatures. Celle-ci, c'est cadeau."
          />
        )}
        {step === "pass" && pass && (
          <Spotlight
            key="pass"
            rect={pass}
            onTap={onPass}
            label="Passer"
            text="Tape ✕ pour passer une offre"
            hint="(ou glisse la carte à gauche) On apprend tes goûts pour mieux trier les suivantes."
          />
        )}
      </AnimatePresence>

      {step === "fly" && (
        <>
          <motion.div
            initial={{ x: startX, y: startY, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ x: target.x + target.w / 2 - 90, y: target.y + target.h / 2 - 30, scale: 0.18, opacity: 0.2, rotate: 8 }}
            transition={{ duration: 0.9, ease: [0.5, 0, 0.3, 1] }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: 180,
              padding: "14px 14px",
              borderRadius: 16,
              background: "#fff",
              boxShadow: "0 16px 36px rgba(0,0,0,.35)",
              zIndex: 94,
              fontWeight: 800,
              fontSize: 14,
              color: "#0d1b14",
            }}
          >
            ♥ {flyTitle ?? "Ton offre"}
          </motion.div>
          <motion.div
            aria-hidden
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.45 }}
            style={{
              position: "fixed",
              left: target.x + target.w / 2 - 4,
              top: target.y - 10,
              zIndex: 95,
              background: "#e5484d",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            +1
          </motion.div>
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            style={{ position: "fixed", left: target.x - 6, top: target.y - 6, width: target.w + 12, height: target.h + 12, borderRadius: 14, border: "3px solid #fff", zIndex: 94 }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            style={{ position: "fixed", left: 16, right: 16, top: "38%", margin: 0, textAlign: "center", color: "#fff", fontSize: 19, fontWeight: 800, lineHeight: 1.3, zIndex: 95 }}
          >
            Ajoutée à tes candidatures ✨
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>Ta candidature t&apos;y attend.</span>
          </motion.p>
        </>
      )}

      {step === "done" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 95, textAlign: "center", color: "#fff" }}
        >
          <p style={{ fontSize: 46, margin: 0 }}>🎯</p>
          <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, margin: "10px 0 0", maxWidth: "16ch" }}>Voilà, tu peux enfin trouver ton job.</p>
          <button
            type="button"
            onClick={onDone}
            className="btn"
            style={{ marginTop: 22, height: 52, padding: "0 28px", borderRadius: 999, border: 0, background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-700))", color: "#fff", fontWeight: 800, fontSize: 16 }}
          >
            C&apos;est parti
          </button>
        </motion.div>
      )}
    </div>
  );
}
