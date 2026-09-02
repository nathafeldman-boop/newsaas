"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/swipe", label: "Swipe", icon: "🔥" },
  { href: "/favoris", label: "Favoris", icon: "♥" },
  { href: "/cv", label: "CV", icon: "📄" },
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
            className="relative flex flex-1 flex-col items-center gap-0.5 text-[11px] no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              color: active ? "var(--color-accent-700)" : "inherit",
              padding: "4px 0",
            }}
          >
            {active && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                style={{
                  position: "absolute",
                  inset: "-4px 6px",
                  borderRadius: 14,
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  zIndex: -1,
                }}
              />
            )}
            <motion.span
              aria-hidden
              animate={{ scale: active ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              style={{ fontSize: 18, lineHeight: 1, opacity: active ? 1 : 0.65 }}
            >
              {item.icon}
            </motion.span>
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
