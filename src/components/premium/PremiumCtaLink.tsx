"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { logButtonClick } from "@/lib/analytics/logButtonClick";

// Wrapper fin autour de Link pour le CTA "Passer Premium", répété sur ~7
// écrans différents (swipe, dashboard, profil, audit CV, guide CV, lettre de
// motivation, simulateur d'entretien) -- `source` dit lequel a été cliqué,
// sans quoi le funnel admin verrait juste "quelqu'un a cliqué Premium"
// sans jamais savoir depuis où, l'info la plus utile pour prioriser quel
// écran convertit vraiment.
export function PremiumCtaLink({
  userId,
  source,
  href = "/premium",
  className,
  style,
  children,
}: {
  userId: string;
  source: string;
  href?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => {
        void logButtonClick(userId, "premium_cta", { source });
      }}
    >
      {children}
    </Link>
  );
}
