"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/favoris", label: "Favoris" },
  { href: "/cv", label: "CV" },
  { href: "/profil", label: "Profil" },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "whitespace-nowrap",
            pathname === link.href && "text-accent-700",
          )}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin/offres"
          className={cn(
            "whitespace-nowrap",
            pathname === "/admin/offres" && "text-accent-700",
          )}
        >
          Admin
        </Link>
      )}
    </>
  );
}
