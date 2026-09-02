"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/offres", label: "Offres" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="seg mb-6" style={{ overflowX: "auto", maxWidth: "100%" }}>
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn("seg-opt", active && "is-active")}
            style={{ whiteSpace: "nowrap", padding: "10px 16px" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
