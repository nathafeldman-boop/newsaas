"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AB_ENTRY_COOKIE, abEntryApplies, abEntryDestination, isAbEntryVariant } from "@/lib/ab/entry";

// Test A/B d'entrée (18/11, Nathan) : sur une page publique, le premier clic
// d'un visiteur non connecté (lien, bouton ou n'importe où sur la page)
// l'envoie sur la page d'accueil ou sur l'inscription selon son groupe. La
// page cliquée sur Google s'affiche toujours d'abord, rien ne bouge sans
// clic. Seule exception : le lien vers l'annonce d'origine (data-ab-keep),
// que Google Emploi exige.
function cookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function loggedIn(): boolean {
  return /(?:^|; )sb-[^=]*-auth-token(?:\.\d+)?=/.test(document.cookie);
}

export function EntryRedirect() {
  const pathname = usePathname();
  useEffect(() => {
    if (!abEntryApplies(pathname)) return;
    const onClick = (e: MouseEvent) => {
      const variant = cookie(AB_ENTRY_COOKIE);
      if (!isAbEntryVariant(variant) || loggedIn()) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-ab-keep]")) return;
      // Champs de saisie, cases, menus : on laisse faire.
      if (target?.closest("input, textarea, select, label, summary, details")) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = abEntryDestination(variant);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);
  return null;
}
