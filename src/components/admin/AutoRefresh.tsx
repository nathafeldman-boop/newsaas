"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Recharge les données de la page toutes les `seconds` secondes tant que
// l'onglet est visible (page « En ligne » de l'admin).
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
