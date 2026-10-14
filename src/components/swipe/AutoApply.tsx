"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { AUTO_SEND_WARNING_THRESHOLD, type AutoSendResult } from "@/lib/applications/autoSend";
import type { Offer } from "@/types/database";

// Like en mode « Postuler directement » : si l'entreprise a publié un email
// et que le Gmail de l'étudiant est connecté, la candidature part depuis sa
// boîte sans quitter le deck ; sinon, la page de candidature s'ouvre comme
// avant, avec la raison. Un message suit chaque envoi (demande de Nathan :
// pas de plafond, mais un avertissement à chaque fois).

type Toast =
  | { id: string; kind: "sending"; company: string; to: string }
  | { id: string; kind: "sent"; company: string; to: string; from: string; count: number }
  | { id: string; kind: "already"; company: string }
  | { id: string; kind: "failed"; company: string };

async function callAutoSend(offerId: string, check: boolean): Promise<AutoSendResult> {
  try {
    const res = await fetch("/api/applications/auto-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, check }),
    });
    return (await res.json()) as AutoSendResult;
  } catch {
    return { status: "error" };
  }
}

export function useAutoApply() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const put = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev.filter((t) => t.id !== toast.id), toast].slice(-3));
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const start = useCallback(
    async (offer: Offer) => {
      const check = await callAutoSend(offer.id, true);
      if (check.status === "manual" && check.reason === "already_sent") {
        put({ id: offer.id, kind: "already", company: offer.company });
        setTimeout(() => dismiss(offer.id), 6000);
        return;
      }
      if (check.status !== "ready") {
        const reason = check.status === "manual" ? check.reason : "error";
        router.push(`/candidature/${offer.id}?express=1&envoi=${reason}`);
        return;
      }
      put({ id: offer.id, kind: "sending", company: offer.company, to: check.to });
      const result = await callAutoSend(offer.id, false);
      if (result.status === "sent") {
        put({ id: offer.id, kind: "sent", company: result.company, to: result.to, from: result.from, count: result.sentLast24h });
        setTimeout(() => dismiss(offer.id), result.sentLast24h >= AUTO_SEND_WARNING_THRESHOLD ? 14000 : 9000);
      } else {
        put({ id: offer.id, kind: "failed", company: offer.company });
      }
    },
    [router, put, dismiss],
  );

  return { start, toasts: <AutoApplyToasts toasts={toasts} onDismiss={dismiss} /> };
}

const muted = "color-mix(in srgb, var(--color-text) 68%, transparent)";

function AutoApplyToasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 flex flex-col items-center gap-2 px-3"
      style={{ bottom: "calc(84px + env(safe-area-inset-bottom))", zIndex: 70 }}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={`${t.id}-${t.kind}`}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="card elev-lg pointer-events-auto w-full"
            style={{ maxWidth: 420, padding: "14px 16px", borderColor: t.kind === "failed" ? "var(--color-neutral-400)" : "var(--color-accent-600)" }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex items-center justify-center"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: t.kind === "failed" ? "var(--color-neutral-200)" : "var(--color-accent-100)",
                  color: t.kind === "failed" ? "var(--color-neutral-700)" : "var(--color-accent-700)",
                }}
              >
                <Icon name={t.kind === "sending" ? "send" : t.kind === "failed" ? "x" : "sparkles"} size={16} strokeWidth={2.1} />
              </span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                {t.kind === "sending" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Envoi de ta candidature à {t.company}…</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>
                      Ta lettre et ton CV partent depuis ton Gmail vers {t.to}. Tu peux continuer à swiper.
                    </p>
                  </>
                )}
                {t.kind === "sent" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Candidature envoyée à {t.company}</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>
                      Elle est vraiment partie de {t.from} vers {t.to}, avec ta lettre et ton CV. Tu la retrouves dans
                      les messages envoyés de ton Gmail, et la réponse arrivera dans ta boîte.
                    </p>
                    {t.count >= AUTO_SEND_WARNING_THRESHOLD && (
                      <p style={{ margin: "8px 0 0", color: "var(--color-accent-800)", fontWeight: 600 }}>
                        {t.count} candidatures envoyées en 24 h. Gmail bloque au-delà d&apos;environ 500 mails par jour,
                        et les recruteurs repèrent les envois en masse : garde tes likes pour les offres qui te plaisent
                        vraiment.
                      </p>
                    )}
                  </>
                )}
                {t.kind === "already" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Déjà envoyée à {t.company}</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>On ne renvoie pas deux fois la même candidature.</p>
                  </>
                )}
                {t.kind === "failed" && (
                  <>
                    <strong style={{ fontSize: 14 }}>L&apos;envoi à {t.company} n&apos;a pas abouti</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>
                      Ta lettre reste prête.{" "}
                      <Link href={`/candidature/${t.id}?express=1&envoi=error`} style={{ fontWeight: 700 }}>
                        Finir la candidature
                      </Link>
                    </p>
                  </>
                )}
              </div>
              {t.kind !== "sending" && (
                <button
                  type="button"
                  onClick={() => onDismiss(t.id)}
                  aria-label="Fermer"
                  style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: muted }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
