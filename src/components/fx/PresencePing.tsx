"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Signal de présence pour l'admin (voir api/presence) : seulement pour un
// visiteur connecté (cookie de session Supabase présent), à l'arrivée, à
// chaque changement de page et toutes les 45 s tant que l'onglet est visible.
const INTERVAL_MS = 45_000;

function ping(path: string) {
  if (!document.cookie.includes("-auth-token")) return;
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
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
