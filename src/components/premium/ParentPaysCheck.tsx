"use client";

import { useState, type ReactNode } from "react";

export const PARENT_PAYS_COOKIE = "parent_pays";

// Moins de 15 ans au paywall (Nathan, 18/11 : « juste ils cochent : oui,
// c'est un parent qui paie »). Rien d'autre : pas d'e-mail, pas de lien.
// La case pose un cookie que l'action de paiement vérifie.
export function ParentPaysCheck({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <label className="card flex-row items-center gap-2.5" style={{ padding: "12px 14px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={ok}
          onChange={(e) => {
            setOk(e.target.checked);
            document.cookie = `${PARENT_PAYS_COOKIE}=${e.target.checked ? "1" : ""}; path=/; max-age=${e.target.checked ? 86_400 : 0}; samesite=lax`;
          }}
          style={{ width: 20, height: 20 }}
        />
        Oui, c&apos;est un de mes parents qui paie
      </label>
      <div style={ok ? undefined : { opacity: 0.45, pointerEvents: "none" }} aria-disabled={!ok}>
        {children}
      </div>
    </>
  );
}
