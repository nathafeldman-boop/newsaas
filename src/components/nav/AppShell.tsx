"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SIDEBAR_COOKIE } from "@/lib/nav/sidebar";
import { cn } from "@/lib/utils";

// Modules de l'appli dans une barre à gauche, sur PC uniquement (16/10,
// demande de Nathan : « comme Stripe ou Claude », sobre et stylé, qui ne gêne
// pas le swipe) : une croix la masque, les trois barres la rouvrent. Sur
// téléphone rien ne change, la barre du bas (BottomNav) reste la navigation.

const WIDTH = 248;

const SECTIONS: { title: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    title: "Trouver",
    items: [
      { href: "/swipe", label: "Offres", icon: "swipe" },
      { href: "/favoris", label: "Favoris", icon: "heart" },
      { href: "/mes-candidatures", label: "Mes candidatures", icon: "send" },
    ],
  },
  {
    title: "Préparer",
    items: [
      { href: "/cv", label: "Mon CV", icon: "file" },
      { href: "/dashboard", label: "Tableau de bord", icon: "dashboard" },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/profil", label: "Profil", icon: "user" },
      { href: "/premium", label: "Premium", icon: "sparkles" },
    ],
  },
];

const muted = "color-mix(in srgb, var(--color-text) 55%, transparent)";

function Sidebar({ open, onClose, favoritesBadge, inboxBadge }: { open: boolean; onClose: () => void; favoritesBadge: number; inboxBadge: number | null }) {
  const pathname = usePathname();
  // « Ma boîte » seulement pour la formule Auto (inboxBadge non null).
  const sections =
    inboxBadge === null
      ? SECTIONS
      : SECTIONS.map((section) =>
          section.title === "Trouver" ? { ...section, items: [...section.items, { href: "/boite", label: "Ma boîte", icon: "mail" as IconName }] } : section,
        );

  return (
    <motion.aside
      aria-label="Modules"
      aria-hidden={!open}
      inert={!open}
      className="hidden sm:flex app-sidebar"
      initial={false}
      animate={{ x: open ? 0 : -WIDTH - 12 }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 30,
        width: WIDTH,
        flexDirection: "column",
        padding: "18px 12px 16px",
        background: "var(--color-neutral-100)",
        borderRight: "1px solid var(--color-divider)",
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: "0 6px 0 10px" }}>
        <Link href="/swipe" className="flex items-center gap-2" style={{ textDecoration: "none", color: "inherit" }}>
          <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-accent)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Stageio
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Masquer le menu"
          data-fx-off
          className="flex items-center justify-center"
          style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: "transparent", color: muted, cursor: "pointer" }}
        >
          <Icon name="x" size={16} strokeWidth={2} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col" style={{ marginTop: 22, gap: 18, overflowY: "auto" }}>
        {sections.map((section) => (
          <div key={section.title}>
            <p
              style={{
                margin: "0 0 6px",
                padding: "0 12px",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              {section.title}
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn("relative flex items-center gap-3 transition-colors duration-150", !active && "hover:bg-[var(--color-surface)]")}
                      style={{
                        height: 38,
                        padding: "0 12px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        textDecoration: "none",
                        color: active ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 82%, transparent)",
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          style={{ position: "absolute", inset: 0, borderRadius: 10, background: "var(--color-accent-100)" }}
                        />
                      )}
                      <span aria-hidden style={{ position: "relative", display: "flex" }}>
                        <Icon name={item.icon} size={18} strokeWidth={active ? 2.2 : 1.8} />
                      </span>
                      <span style={{ position: "relative" }}>
                        {item.label}
                        {((item.href === "/favoris" && favoritesBadge > 0) || (item.href === "/boite" && (inboxBadge ?? 0) > 0)) && (
                          <span
                            style={{
                              marginLeft: 8,
                              minWidth: 18,
                              height: 18,
                              padding: "0 5px",
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#fff",
                              background: "var(--color-accent)",
                            }}
                          >
                            {item.href === "/boite" ? inboxBadge : favoritesBadge}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <form action="/auth/signout" method="post" style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 hover:bg-[var(--color-surface)]"
          style={{ height: 38, padding: "0 12px", borderRadius: 10, border: "none", background: "transparent", fontSize: 13.5, fontWeight: 500, color: muted, cursor: "pointer" }}
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 17l5-5-5-5 M15 12H4" />
          </svg>
          Déconnexion
        </button>
      </form>
    </motion.aside>
  );
}

export function AppShell({
  favoritesBadge,
  inboxBadge = null,
  initialOpen,
  children,
}: {
  favoritesBadge: number;
  inboxBadge?: number | null;
  initialOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);

  function toggle(next: boolean) {
    setOpen(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "open" : "closed"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <>
      <Sidebar open={open} onClose={() => toggle(false)} favoritesBadge={favoritesBadge} inboxBadge={inboxBadge} />
      <AnimatePresence>
        {!open && (
          <motion.button
            key="menu"
            type="button"
            onClick={() => toggle(true)}
            aria-label="Afficher le menu"
            data-fx-off
            className="hidden sm:flex items-center justify-center app-menu-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 30,
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid var(--color-divider)",
              background: "var(--color-neutral-100)",
              boxShadow: "var(--shadow-sm, 0 2px 8px rgba(0,0,0,.06))",
              cursor: "pointer",
              color: "var(--color-text)",
            }}
          >
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16 M4 12h16 M4 17h16" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
      <div className={cn("app-shell-content flex min-h-full flex-1 flex-col transition-[padding] duration-300 ease-out", open && "sm:pl-[248px]")}>
        {children}
      </div>
    </>
  );
}
