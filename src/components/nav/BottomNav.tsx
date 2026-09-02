"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/accueil", label: "Accueil" },
  { href: "/favoris", label: "Likes" },
  { href: "/profil", label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-12 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5"
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
            className="flex flex-col items-center gap-1 text-[12px] no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              color: active ? "var(--color-accent-700)" : "inherit",
            }}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full")}
              style={{ background: active ? "var(--color-accent)" : "transparent" }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
