"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/favoris", label: "Favoris" },
  { href: "/cv", label: "CV" },
  { href: "/profil", label: "Profil" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative whitespace-nowrap transition-colors duration-150",
              active && "text-accent-700",
            )}
          >
            {link.label}
            {active && (
              <motion.span
                layoutId="nav-links-underline"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -6,
                  height: 2,
                  borderRadius: 1,
                  background: "var(--color-accent)",
                }}
              />
            )}
          </Link>
        );
      })}
    </>
  );
}
