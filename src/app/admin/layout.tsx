import { headers } from "next/headers";
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

  const authorized = await hasAdminSession();
  if (!authorized) redirect("/admin/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-divider)", background: "var(--color-surface)" }}
      >
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Stageio — Admin</span>
        <form action={adminLogoutAction}>
          <button type="submit" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }}>
            Déconnexion
          </button>
        </form>
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
