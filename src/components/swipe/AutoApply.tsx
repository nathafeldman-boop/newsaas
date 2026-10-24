"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { FIXABLE_REASONS, type AutoSendChannel, type AutoSendManualReason, type AutoSendResult } from "@/lib/applications/autoSend";
import type { OfferSource } from "@/types/database";

export type ApplyTarget = { id: string; company: string; source?: OfferSource };

// Like avec la formule Auto (24/10) : la candidature part sans quitter le
// deck, par La bonne alternance (service public, gratuit) ou par email quand
// l'entreprise a publié une adresse, 100 par jour au plus. Sinon le like
// reste un favori, avec un message et un lien pour postuler à la main : plus
// de redirection qui sortirait l'étudiant du deck à chaque offre sans email.

type Toast =
  | { id: string; kind: "sending"; company: string; to: string; channel: AutoSendChannel }
  | { id: string; kind: "sent"; company: string; to: string; from: string; count: number; limit: number; channel: AutoSendChannel }
  | { id: string; kind: "already"; company: string }
  | { id: string; kind: "failed"; company: string }
  | { id: string; kind: "notice"; title: string; text: string; href?: string; hrefLabel?: string };

// Infos manquantes que l'étudiant peut compléter sur place (CV, téléphone,
// nom) : l'appelant ouvre sa fenêtre plutôt que la page de candidature.
export type NeedsInfo = (offer: ApplyTarget, reason: AutoSendManualReason) => boolean;

// La bonne alternance limite les envois pour tout Stageio : on réessaie
// quelques fois, l'étudiant continue de swiper.
const BUSY_RETRIES = 4;
const BUSY_DELAY_MS = 20_000;

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
    async (offer: ApplyTarget, needsInfo?: NeedsInfo) => {
      const check = await callAutoSend(offer.id, true);
      if (check.status === "manual" && check.reason === "already_sent") {
        put({ id: offer.id, kind: "already", company: offer.company });
        setTimeout(() => dismiss(offer.id), 6000);
        return;
      }
      if (check.status === "manual" && FIXABLE_REASONS.includes(check.reason) && needsInfo?.(offer, check.reason)) return;
      if (check.status === "manual" && check.reason === "auto_required") {
        router.push(`/candidature/${offer.id}`);
        return;
      }
      if (check.status !== "ready") {
        const reason = check.status === "manual" ? check.reason : "error";
        const limit = check.status === "manual" ? (check.limit ?? 100) : 100;
        put({
          id: offer.id,
          kind: "notice",
          title: reason === "daily_limit" ? `${limit} candidatures envoyées aujourd'hui` : `${offer.company} : dans tes favoris`,
          text:
            reason === "daily_limit"
              ? "C'est le maximum par jour : ce like reste en favori, l'envoi automatique reprend demain."
              : MANUAL_TEXT[reason as AutoSendManualReason] ?? "L'envoi automatique n'a pas pu partir : l'offre reste dans tes favoris.",
          href: `/candidature/${offer.id}`,
          hrefLabel: "Postuler à la main",
        });
        setTimeout(() => dismiss(offer.id), 7000);
        return;
      }
      put({ id: offer.id, kind: "sending", company: offer.company, to: check.to, channel: check.channel });
      let result = await callAutoSend(offer.id, false);
      for (let attempt = 0; result.status === "busy" && attempt < BUSY_RETRIES; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, BUSY_DELAY_MS));
        result = await callAutoSend(offer.id, false);
      }
      if (result.status === "sent") {
        put({
          id: offer.id,
          kind: "sent",
          company: result.company,
          to: result.to,
          from: result.from,
          count: result.sentToday,
          limit: result.limit,
          channel: result.channel,
        });
        setTimeout(() => dismiss(offer.id), 9000);
      } else {
        put({ id: offer.id, kind: "failed", company: offer.company });
      }
    },
    [router, put, dismiss],
  );

  const notify = useCallback(
    (notice: Omit<Extract<Toast, { kind: "notice" }>, "kind">) => put({ ...notice, kind: "notice" }),
    [put],
  );

  return { start, notify, toasts: <AutoApplyToasts toasts={toasts} onDismiss={dismiss} /> };
}

const muted = "color-mix(in srgb, var(--color-text) 68%, transparent)";

// Pourquoi un like n'a pas pu partir tout seul (le like reste un favori).
const MANUAL_TEXT: Partial<Record<AutoSendManualReason, string>> = {
  no_email: "Le recruteur n'a pas publié d'adresse : pas d'envoi automatique pour celle-ci.",
  lba_off: "L'envoi par La bonne alternance n'est pas encore ouvert : postule depuis l'offre.",
  inbox_off: "La boîte de candidature n'est pas encore active : postule depuis l'offre.",
  cv_too_big: "Ton CV dépasse 3 Mo : allège-le dans l'onglet CV pour l'envoi automatique.",
  not_found: "Cette offre n'est plus en ligne.",
};

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
                <Icon
                  name={t.kind === "sending" ? "send" : t.kind === "failed" ? "x" : t.kind === "notice" ? "pen" : "sparkles"}
                  size={16}
                  strokeWidth={2.1}
                />
              </span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.45 }}>
                {t.kind === "sending" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Envoi de ta candidature à {t.company}…</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>
                      {t.channel === "lba"
                        ? "Ta lettre et ton CV partent via La bonne alternance, le service public de l'alternance."
                        : `Ta lettre et ton CV partent vers ${t.to}.`}{" "}
                      Tu peux continuer à swiper.
                    </p>
                  </>
                )}
                {t.kind === "sent" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Candidature envoyée à {t.company}</strong>
                    {t.channel === "lba" ? (
                      <p style={{ margin: "2px 0 0", color: muted }}>
                        La bonne alternance l&apos;a transmise au recruteur, avec ta lettre et ton CV. Sa réponse
                        arrivera sur {t.from}.
                      </p>
                    ) : (
                      <p style={{ margin: "2px 0 0", color: muted }}>
                        Elle est vraiment partie vers {t.to}, avec ta lettre et ton CV. La réponse du recruteur
                        arrivera dans ta{" "}
                        <Link href="/boite" style={{ fontWeight: 700 }}>
                          boîte Stageio
                        </Link>
                        .
                      </p>
                    )}
                    <p style={{ margin: "6px 0 0", color: "var(--color-accent-800)", fontWeight: 600 }}>
                      {t.count}/{t.limit} aujourd&apos;hui
                    </p>
                  </>
                )}
                {t.kind === "already" && (
                  <>
                    <strong style={{ fontSize: 14 }}>Déjà envoyée à {t.company}</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>On ne renvoie pas deux fois la même candidature.</p>
                  </>
                )}
                {t.kind === "notice" && (
                  <>
                    <strong style={{ fontSize: 14 }}>{t.title}</strong>
                    <p style={{ margin: "2px 0 0", color: muted }}>
                      {t.text}
                      {t.href && (
                        <>
                          {" "}
                          <Link href={t.href} style={{ fontWeight: 700 }}>
                            {t.hrefLabel ?? "Voir"}
                          </Link>
                        </>
                      )}
                    </p>
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
