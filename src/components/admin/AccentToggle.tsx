"use client";

import { useState } from "react";

import { ADMIN_ACCENT_COOKIE, type AdminAccent } from "@/lib/admin/accent";

// Bouton de l'en-tête admin (17/11) : bascule l'accent violet ⇄ vert en un
// clic, mémorisé dans un cookie (lu par app/admin/layout.tsx au rendu).
export function AccentToggle({ initial }: { initial: AdminAccent }) {
  const [accent, setAccent] = useState<AdminAccent>(initial);
  const next: AdminAccent = accent === "violet" ? "vert" : "violet";
  return (
    <button
      type="button"
      className="btn btn-secondary"
      style={{ padding: "6px 12px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 8 }}
      aria-label={`Passer au thème ${next}`}
      onClick={() => {
        document.querySelector(".admin-dark")?.setAttribute("data-accent", next);
        document.cookie = `${ADMIN_ACCENT_COOKIE}=${next}; path=/admin; max-age=31536000; samesite=lax`;
        setAccent(next);
      }}
    >
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: 6, background: next === "vert" ? "#22c55e" : "#635bff" }} />
      Thème {next}
    </button>
  );
}
