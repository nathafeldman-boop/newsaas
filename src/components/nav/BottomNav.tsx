"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/accueil", label: "Accueil", icon: "🏠" },
  { href: "/swipe", label: "Swipe", icon: "🔥" },
  { href: "/favoris", label: "Likes", icon: "♥" },
  { href: "/profil", label: "Profil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-20 flex items-center justify-around px-2 pb-[calc(6px+env(safe-area-inset-bottom))] pt-2"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-divider)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 text-[11px] no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              color: active ? "var(--color-accent-700)" : "inherit",
              padding: "4px 0",
            }}
          >
            <span aria-hidden style={{ fontSize: 18, lineHeight: 1, opacity: active ? 1 : 0.65 }}>
              {item.icon}
            </span>
            {item.label}
            <span
              className={cn("h-1 w-1 rounded-full")}
              style={{ background: active ? "var(--color-accent)" : "transparent" }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
