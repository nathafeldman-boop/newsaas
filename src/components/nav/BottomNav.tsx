"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { FavoritesTabIcon } from "@/components/fx/FavoritesTabIcon";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/swipe", label: "Swipe", icon: "swipe" },
  { href: "/favoris", label: "Favoris", icon: "heart" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/cv", label: "CV", icon: "file" },
  { href: "/profil", label: "Profil", icon: "user" },
];

export function BottomNav({ favoritesBadge = 0 }: { favoritesBadge?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-20 flex items-center justify-around px-2 pb-[calc(6px+env(safe-area-inset-bottom))] pt-2"
      style={{
        background: "color-mix(in srgb, var(--color-neutral-100) 90%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
      }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-1 no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              color: active ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 65%, transparent)",
              padding: "2px 0",
            }}
          >
            <span
              className="relative flex items-center justify-center"
              style={{ width: 52, height: 30, borderRadius: 999 }}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "color-mix(in srgb, var(--color-accent) 13%, transparent)",
                  }}
                />
              )}
              {item.href === "/favoris" ? (
                <FavoritesTabIcon baseCount={favoritesBadge}>
                  <TabIcon icon={item.icon} active={active} />
                </FavoritesTabIcon>
              ) : (
                <TabIcon icon={item.icon} active={active} />
              )}
            </span>
            <span className={cn("text-[10.5px]", active && "font-bold")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TabIcon({ icon, active }: { icon: IconName; active: boolean }) {
  return (
    <motion.span
      aria-hidden
      animate={{ scale: active ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ position: "relative", display: "flex", lineHeight: 1, opacity: active ? 1 : 0.8 }}
    >
      <Icon name={icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
    </motion.span>
  );
}
