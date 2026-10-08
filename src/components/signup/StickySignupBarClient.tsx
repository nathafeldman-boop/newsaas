"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Barre d'inscription en bas d'écran, téléphone seulement (voir
// StickySignupBar). Apparaît après un peu de lecture, jamais pour quelqu'un
// de connecté (cookie de session Supabase), et se ferme pour 7 jours.
const DISMISS_KEY = "stageio_signup_bar_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_PX = 500;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function StickySignupBarClient({ href, text }: { href: string; text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (document.cookie.includes("-auth-token") || dismissedRecently()) return;
    const onScroll = () => {
      if (window.scrollY < SHOW_AFTER_PX) return;
      setVisible(true);
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Stockage indisponible : la barre se ferme pour cette page seulement.
    }
    setVisible(false);
  };

  return (
    // Conteneur masqué sur ordinateur : le display: flex en ligne de la barre
    // l'emporterait sur une classe posée directement dessus.
    <div className="print:hidden md:hidden">
      {/* Réserve la place de la barre : le bas de page reste lisible. */}
      <div aria-hidden style={{ height: 76 }} />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 45,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px calc(10px + env(safe-area-inset-bottom)) 16px",
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-divider)",
          boxShadow: "0 -6px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 13, lineHeight: 1.35 }}>{text}</p>
        <Link href={href} className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
          S&apos;inscrire
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          style={{ background: "none", border: "none", padding: 4, fontSize: 20, lineHeight: 1, color: "inherit", opacity: 0.55, cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
