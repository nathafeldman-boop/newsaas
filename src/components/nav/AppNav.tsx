import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/nav/NavLinks";

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
    <header
      className="nav hidden sm:flex sticky top-0 z-20 mx-auto w-full max-w-[1040px] overflow-x-auto"
      style={{ borderBottom: "1px solid var(--color-divider)", background: "var(--color-bg)" }}
    >
      <a href="/swipe" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
        Stageio
      </a>
      <NavLinks isAdmin={isAdmin} />
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn btn-secondary">
          Déconnexion
        </button>
      </form>
    </header>
  );
}
