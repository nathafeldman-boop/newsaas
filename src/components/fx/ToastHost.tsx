"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SparkleBurst } from "@/components/fx/SparkleBurst";
import { TOAST, prefersReducedMotion, type ToastInput } from "@/lib/fx/events";

// Notifications de l'appli (16/10, demande de Nathan : une animation « à
// chaque notification ») : la carte tombe du haut avec un rebond, l'icône
// pop en tournant, une barre se vide pendant l'affichage, et une bonne
// nouvelle part dans une gerbe d'étincelles. On la chasse en la glissant
// vers le haut ou en la touchant. Déclenchée par showToast (lib/fx/events).

type Toast = ToastInput & { id: number };

const DURATION_MS = 3400;
const DEFAULT_ICON = { success: "✓", info: "✦", error: "!" } as const;

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let nextId = 0;
    function onToast(event: Event) {
      nextId += 1;
      const toast = { ...(event as CustomEvent<ToastInput>).detail, id: nextId };
      setToasts((prev) => [...prev.slice(-2), toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), DURATION_MS);
    }
    window.addEventListener(TOAST, onToast);
    return () => window.removeEventListener(TOAST, onToast);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 flex flex-col items-center gap-2 px-3"
      style={{ top: "calc(10px + env(safe-area-inset-top))", zIndex: 150 }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = toast.tone ?? "success";
          const accent = tone === "error" ? "var(--color-neutral-600)" : "var(--color-accent)";
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ y: -80, opacity: 0, scale: 0.85, rotate: -2 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
              exit={{ y: -60, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 520, damping: 26 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.8, bottom: 0.1 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -30) dismiss(toast.id);
              }}
              onClick={() => dismiss(toast.id)}
              className="pointer-events-auto w-full"
              style={{
                position: "relative",
                maxWidth: 400,
                borderRadius: 22,
                padding: "12px 14px 14px",
                background: "color-mix(in srgb, var(--color-neutral-100) 92%, transparent)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 14px 34px color-mix(in srgb, #132b33 22%, transparent)",
                border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
                cursor: "pointer",
                overflow: "visible",
              }}
            >
              {tone === "success" && !prefersReducedMotion() && <SparkleBurst count={12} spread={110} />}
              <div className="flex items-center gap-3">
                <motion.span
                  aria-hidden
                  initial={{ scale: 0, rotate: -120 }}
                  animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#fff",
                    background:
                      tone === "error"
                        ? "linear-gradient(135deg, var(--color-neutral-500), var(--color-neutral-700))"
                        : "linear-gradient(135deg, #3ee08f, var(--color-accent))",
                    boxShadow: `0 6px 16px color-mix(in srgb, ${accent} 40%, transparent)`,
                  }}
                >
                  {toast.icon ?? DEFAULT_ICON[tone]}
                </motion.span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 14.5 }}>{toast.title}</p>
                  {toast.text && (
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 68%, transparent)" }}>
                      {toast.text}
                    </p>
                  )}
                </div>
              </div>
              {/* Temps restant */}
              <motion.span
                aria-hidden
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: DURATION_MS / 1000, ease: "linear" }}
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 6,
                  height: 3,
                  borderRadius: 999,
                  transformOrigin: "left",
                  background: `linear-gradient(90deg, #3ee08f, ${accent})`,
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
