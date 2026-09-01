import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/swipe", label: "Swipe" },
  { href: "/favoris", label: "Favoris" },
  { href: "/mes-candidatures", label: "Candidatures" },
  { href: "/parrainage", label: "Parrainage" },
];

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user?.email) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    isAdmin = adminEmails.includes(user.email.toLowerCase());
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/swipe" className="text-lg font-bold text-brand-dark">
          Alt
        </Link>

        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/offres"
              className="text-foreground/70 hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="text-sm font-medium text-foreground/70 hover:text-foreground"
          >
            Profil
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <nav className="flex sm:hidden items-center gap-4 overflow-x-auto px-4 pb-3 text-sm font-medium">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-foreground/70 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin/offres"
            className="whitespace-nowrap text-foreground/70 hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
