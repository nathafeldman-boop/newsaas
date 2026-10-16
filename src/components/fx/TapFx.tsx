"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/fx/events";

// Chaque toucher sur un élément cliquable lâche une onde à l'endroit du doigt
// (16/10, demande de Nathan : « des animations de dingue à chaque clic ») ;
// les boutons principaux projettent en plus une gerbe d'étincelles et font
// vibrer le téléphone une fraction de seconde. Effet purement décoratif,
// en DOM direct (aucun rendu React par toucher). Rien si le téléphone
// demande moins d'animations. `data-fx-off` sur un conteneur le désactive.

const CLICKABLE = 'button, a[href], [role="button"], [role="tab"], label.seg-opt, summary, select';
const BURST = ".btn-primary, .btn-gradient, [data-fx-burst]";
const SPARK_COLORS = ["#3ee08f", "#ffd84d", "#7fe3ff", "#ffffff", "#0f9c56", "#ff8fb1"];
const SPARKS = 8;

export function TapFx() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const layer = document.createElement("div");
    layer.className = "fx-tap-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    function spawn(className: string, x: number, y: number, vars: Record<string, string> = {}) {
      const el = document.createElement("span");
      el.className = className;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      for (const [name, value] of Object.entries(vars)) el.style.setProperty(name, value);
      layer.appendChild(el);
      // animationend + filet de sécurité : jamais d'élément oublié.
      const remove = () => el.remove();
      el.addEventListener("animationend", remove, { once: true });
      setTimeout(remove, 1000);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = (event.target as Element | null)?.closest?.(CLICKABLE) as HTMLElement | null;
      if (!target || target.closest("[data-fx-off]")) return;
      if ((target as HTMLButtonElement).disabled || target.getAttribute("aria-disabled") === "true") return;

      const { clientX: x, clientY: y } = event;
      const burst = target.matches(BURST);
      spawn("fx-tap-ring", x, y, burst ? { "--fx-color": "#3ee08f" } : {});
      if (!burst) return;
      for (let i = 0; i < SPARKS; i++) {
        const angle = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 34 + Math.random() * 30;
        spawn("fx-tap-spark", x, y, {
          "--dx": `${Math.cos(angle) * distance}px`,
          "--dy": `${Math.sin(angle) * distance}px`,
          "--spark": SPARK_COLORS[i % SPARK_COLORS.length],
        });
      }
      try {
        navigator.vibrate?.(8);
      } catch {
        // Vibration refusée par le navigateur : sans importance.
      }
    }

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      layer.remove();
    };
  }, []);

  return null;
}
