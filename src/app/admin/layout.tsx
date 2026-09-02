import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { AdminTabs } from "@/components/admin/AdminTabs";

// Hors du groupe (app) volontairement : pas de nav consommateur (Swipe/
// Favoris/CV/Profil), pas de PageTransition, pas de redirection paywall —
// un espace interne totalement déconnecté du parcours utilisateur, jamais
// lié depuis l'appli elle-même (accès uniquement via l'URL directe).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/swipe");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--color-divider)", background: "var(--color-surface)" }}
      >
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Stageio — Admin</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }}>
            Déconnexion
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-8">
        <AdminTabs />
        {children}
      </main>
    </div>
  );
}
