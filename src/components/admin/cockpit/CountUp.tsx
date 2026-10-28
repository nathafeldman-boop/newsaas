"use client";

import { useEffect, useRef, useState } from "react";

// Chiffre qui défile jusqu'à sa valeur (à l'arrivée et à chaque
// rafraîchissement), pour voir d'un coup d'œil ce qui a bougé. Rien ne
// bouge si l'appareil demande moins d'animations.
export function CountUp({ value, duration = 700, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  // Valeur affichée à l'instant : point de départ de l'animation suivante
  // (aussi quand React relance l'effet, en développement).
  const shownRef = useRef(0);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    const show = (v: number) => {
      shownRef.current = v;
      setShown(v);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => show(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      show(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(shown) : shown.toLocaleString("fr-FR")}</>;
}
