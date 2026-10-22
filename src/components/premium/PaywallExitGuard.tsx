"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { offerRefundGuaranteeAction } from "@/app/(app)/premium/guarantee-actions";
import { GUARANTEE_CONDITIONS, GUARANTEE_COOKIE, setBrowserCookie } from "@/lib/premium/guaranteeTerms";
import { GuaranteeHero } from "@/components/premium/GuaranteeHero";

export const GUARANTEE_EVENT = "stageio:guarantee";

// Message en quittant le paywall (Nathan, 20/10) : un clic sur un lien qui
// sort de /premium (croix, menu) ouvre ce message, une fois à chaque passage
// sur le paywall (22/10, avant : une fois par session), avec la même carte
// « Remboursé » qu'avant le paywall, et accorde la garantie remboursé. Le bouton retour du navigateur n'est
// jamais détourné. Les CGV restent ouvrables sans passer par ici.
export function PaywallExitGuard() {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // Garantie déjà vue sur l'écran avant le paywall : on la rappelle au lieu
  // de la présenter comme un geste de plus.
  const [alreadyGranted, setAlreadyGranted] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (shown.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === "/premium" || url.pathname.startsWith("/legal")) return;
      e.preventDefault();
      e.stopPropagation();
      shown.current = true;
      setAlreadyGranted(document.cookie.split("; ").some((c) => c.startsWith(`${GUARANTEE_COOKIE}=`)));
      setBrowserCookie(GUARANTEE_COOKIE);
      void offerRefundGuaranteeAction();
      setPendingHref(url.pathname + url.search + url.hash);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  function stay() {
    setPendingHref(null);
    window.dispatchEvent(new Event(GUARANTEE_EVENT));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence>
      {pendingHref && (
        <motion.div
          key="exit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Avant de partir"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "color-mix(in srgb, var(--color-text) 45%, transparent)",
            display: "flex",
            padding: 16,
            overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            className="flex w-full flex-col items-center text-center"
            style={{
              maxWidth: 400,
              // Centré, et défilable sur petit écran (jamais coupé en haut).
              margin: "auto",
              background: "var(--color-bg)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              padding: "26px 20px 20px",
            }}
          >
            <div aria-hidden style={{ fontSize: 46, lineHeight: 1 }}>😢</div>
            <h2 style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.25, margin: "12px 0 0" }}>
              Attends… tu t&apos;étais engagé·e à ne pas lâcher
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 68%, transparent)" }}>
              On est vraiment déçus de te voir partir.{" "}
              {alreadyGranted ? "Et n'oublie pas, tu as notre garantie :" : "Alors on va plus loin pour toi :"}
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25, margin: "14px 0 0" }}>
              Des résultats, ou on te rembourse.
            </p>
            <GuaranteeHero marginTop={12} />
            <p style={{ fontSize: 11.5, lineHeight: 1.45, margin: "10px 0 0", textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              Conditions : {GUARANTEE_CONDITIONS}{" "}
              <a href="/legal/cgv#garantie" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>
                Détails dans les CGV
              </a>
              .
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={stay}
              style={{ marginTop: 16, height: 50, borderRadius: 999, fontSize: 15, fontWeight: 700 }}
            >
              Je reste et je m&apos;engage 💪
            </button>
            <button
              type="button"
              onClick={() => router.push(pendingHref)}
              style={{
                marginTop: 10,
                fontSize: 13,
                fontWeight: 600,
                background: "none",
                border: "none",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                cursor: "pointer",
              }}
            >
              Partir quand même
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Rappel sur le paywall une fois la garantie accordée (cookie lu côté
// serveur, ou à l'instant via le message ci-dessus).
export function GuaranteeBadge({ initialVisible }: { initialVisible: boolean }) {
  const [visible, setVisible] = useState(initialVisible);
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener(GUARANTEE_EVENT, show);
    return () => window.removeEventListener(GUARANTEE_EVENT, show);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="animate-in"
      style={{
        marginTop: 14,
        borderRadius: 14,
        padding: "11px 14px",
        border: "1.5px solid var(--color-accent)",
        background: "var(--color-accent-100)",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <strong>🛡️ Ta garantie est activée :</strong> aucun entretien en 3 mois de Premium = remboursé, sur toutes les
      formules.{" "}
      <a href="/legal/cgv#garantie" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>
        Conditions
      </a>
    </div>
  );
}
