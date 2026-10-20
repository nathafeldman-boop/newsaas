import { cookies } from "next/headers";
import { AppShell } from "@/components/nav/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { PageTransition } from "@/components/nav/PageTransition";
import { createClient } from "@/lib/supabase/server";
import { SIDEBAR_COOKIE } from "@/lib/nav/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = (await cookies()).get(SIDEBAR_COOKIE)?.value !== "closed";

  // Badge "Favoris" de la BottomNav (voir design mobile) : nombre d'offres
  // likées pas encore candidatées -- calculé sur toute page authentifiée.
  // Hard paywall (26/09) : la navigation dans /swipe n'est plus plafonnée
  // (voir RETENTION_AUDIT.md), donc il n'y a plus de redirection globale vers
  // /premium à ce niveau -- like et candidature sont bloqués à la source
  // (voir SwipeDeck.tsx et le trigger SQL enforce_swipe_quota /
  // enforce_premium_application) plutôt que via un quota de navigation.
  let favoritesBadge = 0;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Présence « en ligne » : envoyée par PresencePing (layout racine) via
      // /api/presence, plus ici -- deux écritures de moins à chaque page.
      const [{ data: swiped }, { data: applications }] = await Promise.all([
        supabase.from("swipes").select("offer_id").eq("user_id", user.id).eq("direction", "like"),
        supabase.from("applications").select("offer_id").eq("user_id", user.id),
      ]);

      const appliedOfferIds = new Set((applications ?? []).map((a) => a.offer_id));
      const likedOfferIds = new Set((swiped ?? []).map((s) => s.offer_id));
      favoritesBadge = [...likedOfferIds].filter((id) => !appliedOfferIds.has(id)).length;
    }
  } catch (err) {
    // Ce check tourne sur CHAQUE navigation de l'appli : un pépin
    // transitoire (Supabase lent/indisponible un instant) ne doit jamais
    // faire planter toute la page -- on laisse passer plutôt que
    // d'afficher un écran blanc.
    console.error("AppLayout favorites badge check failed", err);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppShell favoritesBadge={favoritesBadge} initialOpen={sidebarOpen}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-8 sm:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </AppShell>
      <BottomNav favoritesBadge={favoritesBadge} />
    </div>
  );
}
