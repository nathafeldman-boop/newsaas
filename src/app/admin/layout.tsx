import { cookies, headers } from "next/headers";
import { AccentToggle } from "@/components/admin/AccentToggle";
import { ADMIN_ACCENT_COOKIE, type AdminAccent } from "@/lib/admin/accent";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin/accessCode";
import { adminLogoutAction } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin/AdminNav";

// Hors du groupe (app) volontairement : pas de nav consommateur (Swipe/
// Favoris/CV/Profil), pas de PageTransition, pas de redirection paywall, et
// pas de compte Supabase à créer/connecter — juste le code d'accès défini
// dans ADMIN_ACCESS_CODE. Un espace interne totalement déconnecté du
// parcours utilisateur, jamais lié depuis l'appli elle-même.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  // Parcours de démo (tournage TikTok) : plein écran, sans l'en-tête admin.
  if (pathname === "/admin/demo") {
    if (!(await hasAdminSession())) redirect("/admin/login");
    return <>{children}</>;
  }

  const authorized = await hasAdminSession();
  if (!authorized) redirect("/admin/login");

  const accent: AdminAccent = (await cookies()).get(ADMIN_ACCENT_COOKIE)?.value === "vert" ? "vert" : "violet";

  return (
    <div className="admin-dark flex min-h-full flex-1 flex-col" data-accent={accent}>
      <header className="admin-topbar flex items-center justify-between px-5 py-3">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700 }}>
          <span aria-hidden style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg, #2ecc71, #0f8a4a)" }} />
          Stageio Admin
        </span>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <AccentToggle initial={accent} />
          <form action={adminLogoutAction}>
            <button type="submit" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }}>
              Déconnexion
            </button>
          </form>
        </span>
      </header>
      <div className="admin-shell">
        <aside className="admin-side">
          <AdminNav />
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
