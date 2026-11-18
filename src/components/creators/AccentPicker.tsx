"use client";

import { useState, useTransition } from "react";
import { CREATOR_ACCENTS } from "@/lib/creators/accents";
import { setCreatorAccentAction } from "@/app/createurs/actions";

// Couleur du dashboard créateur (18/11) : change tout de suite à l'écran,
// puis gardée sur le compte.
export function AccentPicker({ initial }: { initial: string }) {
  const [current, setCurrent] = useState(initial);
  const [, start] = useTransition();
  return (
    <div style={{ display: "flex", gap: 8 }} role="radiogroup" aria-label="Couleur du dashboard">
      {CREATOR_ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={current === a.id}
          aria-label={a.label}
          title={a.label}
          onClick={() => {
            setCurrent(a.id);
            document.querySelector(".creator-space")?.setAttribute("data-accent", a.id);
            start(() => setCreatorAccentAction(a.id));
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            background: a.color,
            border: current === a.id ? "2px solid #fff" : "2px solid transparent",
            boxShadow: current === a.id ? `0 0 0 3px ${a.color}55` : "none",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
