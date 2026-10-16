"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Signal de présence pour l'admin (voir api/presence) : seulement pour un
// visiteur connecté (cookie de session Supabase présent), à l'arrivée, à
// chaque changement de page, toutes les 30 s tant que l'onglet est visible,
// et au premier geste après 20 s sans signal (toucher, scroll, clavier).
// Jamais depuis /admin : Nathan sur son tableau de bord n'est pas un
// utilisateur en ligne.
const INTERVAL_MS = 30_000;
const ACTIVITY_THROTTLE_MS = 20_000;

let lastPing = 0;

function ping(path: string) {
  if (path.startsWith("/admin") || !document.cookie.includes("-auth-token")) return;
  lastPing = Date.now();
  void fetch("/api/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {});
}

export function PresencePing() {
  const pathname = usePathname();

  useEffect(() => {
    ping(pathname);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") ping(pathname);
    }, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping(pathname);
    };
    const onActivity = () => {
      if (Date.now() - lastPing > ACTIVITY_THROTTLE_MS) ping(pathname);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, [pathname]);

  return null;
}
