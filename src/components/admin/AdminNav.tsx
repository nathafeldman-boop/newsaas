"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Navigation de l'admin, regroupée par question (« comment va Stageio »,
// « qui sont les clients », « d'où viennent-ils »…). Barre latérale sur
// ordinateur, bandeau défilant sur téléphone.
const GROUPS = [
  {
    title: "Pilotage",
    links: [
      { href: "/admin", label: "Vue d'ensemble" },
      { href: "/admin/revenus", label: "Revenus et MRR" },
      { href: "/admin/abonnements", label: "Abonnements et churn" },
      { href: "/admin/cohortes", label: "Cohortes" },
      { href: "/admin/fonctionnalites", label: "Fonctionnalités" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/admin/users", label: "Utilisateurs" },
      { href: "/admin/premium", label: "Payants" },
      { href: "/admin/annulations", label: "Motifs d'annulation" },
      { href: "/admin/retention", label: "Rétention (SOP)" },
      { href: "/admin/stripe", label: "Ventes cumulées" },
    ],
  },
  {
    title: "Acquisition",
    links: [
      { href: "/admin/acquisition", label: "Trafic et conversion" },
      { href: "/admin/rpm", label: "RPM" },
      { href: "/admin/affiliates", label: "Affiliés" },
      { href: "/admin/emails", label: "E-mails et relances" },
      { href: "/admin/relance", label: "Pilotage des envois" },
    ],
  },
  {
    title: "Exploitation",
    links: [
      { href: "/admin/sante", label: "Santé et données" },
      { href: "/admin/offres", label: "Offres" },
      { href: "/admin/codes", label: "Codes" },
      { href: "/admin/online", label: "En ligne" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav aria-label="Admin" className="admin-nav">
      {GROUPS.map((group) => (
        <div key={group.title} className="admin-nav-group">
          <div className="admin-nav-title">{group.title}</div>
          {group.links.map((link) => (
            <Link key={link.href} href={link.href} className={cn("admin-nav-link", isActive(link.href) && "is-active")} aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
