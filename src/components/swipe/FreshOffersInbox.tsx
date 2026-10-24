"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { logButtonClick } from "@/lib/analytics/logButtonClick";
import { shortAge } from "@/lib/offers/freshness";

// Nouveautés à l'arrivée sur le deck (24/10, Nathan : « dès qu'ils se
// connectent… elle est là depuis 24 heures, tu dois la prendre ») : les
// offres de moins de 24 h qui matchent le profil, déjà placées en tête du
// deck (voir orderFreshFirst). « Nouveau » = publiée depuis la dernière
// ouverture du panneau, mémorisée dans ce navigateur seulement.

export type FreshInboxItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: string;
  published_at: string;
};

const SEEN_KEY = "stageio:fresh-seen-at";
const blur = { filter: "blur(5px)", userSelect: "none" as const };

function readSeenAt(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSeenAt(ms: number) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(ms));
  } catch {
    // navigation privée : le badge reviendra, sans gravité
  }
}

const newOffers = (n: number) => (n > 1 ? `${n} nouvelles offres` : "1 nouvelle offre");

export function FreshOffersInbox({ items, isPremium, userId }: { items: FreshInboxItem[]; isPremium: boolean; userId: string }) {
  // null tant que le navigateur n'a pas été lu (rendu serveur) : pas de badge.
  const [seenAt, setSeenAt] = useState<number | null>(null);
  const [toast, setToast] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = readSeenAt();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeenAt(seen);
    if (!items.some((i) => new Date(i.published_at).getTime() > seen)) return;
    const show = setTimeout(() => setToast(true), 600);
    const hide = setTimeout(() => setToast(false), 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [items]);

  const isNew = (i: FreshInboxItem) => seenAt !== null && new Date(i.published_at).getTime() > seenAt;
  const unseen = items.filter(isNew).length;
  const newest = items[0];

  function openPanel(source: string) {
    setToast(false);
    setOpen(true);
    void logButtonClick(userId, "fresh_inbox_open", { source, count: items.length, unseen });
  }

  function closePanel() {
    setOpen(false);
    const now = Date.now();
    writeSeenAt(now);
    setSeenAt(now);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openPanel("bell")}
        aria-label={unseen > 0 ? `Nouveautés : ${newOffers(unseen)}` : "Nouveautés"}
        className="card elev-sm"
        style={{
          position: "relative",
          width: 42,
          height: 42,
          padding: 0,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-accent-700)",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={20} strokeWidth={2} />
        {unseen > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 19,
              height: 19,
              padding: "0 5px",
              borderRadius: 999,
              background: "#f05a1a",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 2px var(--color-bg)",
            }}
          >
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </button>

      <AnimatePresence>
        {toast && newest && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="elev-md"
            style={{
              position: "fixed",
              top: 14,
              borderRadius: 18,
              border: "1px solid var(--color-neutral-200)",
              left: "50%",
              x: "-50%",
              zIndex: 60,
              width: "min(92vw, 380px)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--color-neutral-100)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#fff1e6",
                color: "#c2410c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="bell" size={19} strokeWidth={2.1} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 14 }}>
                {newOffers(unseen)} pour toi
              </strong>
              <span style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }} suppressHydrationWarning>
                La dernière publiée {shortAge(newest.published_at)}. Elles partent vite.
              </span>
            </span>
            <button type="button" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => openPanel("toast")}>
              Voir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
              background: "rgba(19,43,51,.45)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Nouveautés pour toi"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="card elev-md"
              style={{
                width: "min(100%, 460px)",
                maxHeight: "82vh",
                overflowY: "auto",
                margin: "0 0 env(safe-area-inset-bottom)",
                borderRadius: "22px 22px 0 0",
                padding: "18px 16px 20px",
                background: "var(--color-neutral-100)",
              }}
            >
              <div className="flex items-center justify-between" style={{ gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Nouveautés pour toi</h2>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Fermer"
                  style={{ background: "none", border: 0, padding: 6, cursor: "pointer", color: "inherit" }}
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
              <p style={{ margin: "4px 0 14px", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
                {items.length > 0
                  ? "Publiées ces dernières 24 h, et qui matchent ton profil. Le recruteur peut les retirer à tout moment : postule tant qu'elles sont en ligne."
                  : "Rien de neuf pour ton profil depuis 24 h. On ajoute les nouvelles offres en continu, à la minute : reviens un peu plus tard."}
              </p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "#fff",
                      border: isNew(item) ? "1px solid #fdba8c" : "1px solid var(--color-neutral-200)",
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 6, fontSize: 12, fontWeight: 700, color: "#9a3a0c" }}>
                      <span className="hot-dot" aria-hidden />
                      <span suppressHydrationWarning>Publiée {shortAge(item.published_at)}</span>
                      <span style={{ color: "var(--color-neutral-600)", fontWeight: 600 }}>
                        · {item.contract_type === "alternance" ? "Alternance" : "Stage"}
                      </span>
                      {isNew(item) && (
                        <span className="tag tag-hot" style={{ marginLeft: "auto", padding: "1px 8px", fontSize: 10.5 }}>
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{item.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--color-neutral-700)" }}>
                      <span style={isPremium ? undefined : blur}>
                        {item.company} · {item.location}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-2">
                <button type="button" className="btn btn-primary btn-block" onClick={closePanel}>
                  {items.length > 0 ? "Les voir en tête de mon deck" : "Retour au deck"}
                </button>
                {!isPremium && items.length > 0 && (
                  <PremiumCtaLink userId={userId} source="fresh_inbox" className="btn btn-ghost btn-block">
                    Débloquer les entreprises et postuler
                  </PremiumCtaLink>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
