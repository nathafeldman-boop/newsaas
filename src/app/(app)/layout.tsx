import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav/AppNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { computeQuotaStatus } from "@/lib/subscription/quota";
import { isAdminEmail } from "@/lib/admin/assertAdmin";

// Pages où on ne redirige jamais vers /premium, même quota dépassé : la page
// premium elle-même (boucle infinie sinon) et l'espace admin.
const PAYWALL_EXEMPT_PATHS = ["/premium", "/admin"];

function isExempt(pathname: string) {
  return PAYWALL_EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (!isExempt(pathname)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !isAdminEmail(user.email)) {
      const [{ data: profile }, { data: swiped }, { data: applications }] = await Promise.all([
        supabase.from("profiles").select("subscription_status").eq("id", user.id).single(),
        supabase.from("swipes").select("offer_id, created_at").eq("user_id", user.id),
        supabase.from("applications").select("offer_id").eq("user_id", user.id),
      ]);

      const { quotaReached } = computeQuotaStatus(profile, swiped ?? [], applications ?? []);

      if (quotaReached) {
        redirect("/premium?limite=1");
      }
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
