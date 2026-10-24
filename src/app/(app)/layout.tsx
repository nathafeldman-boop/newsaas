import { cookies } from "next/headers";
import { AppShell } from "@/components/nav/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { PageTransition } from "@/components/nav/PageTransition";
import { createClient } from "@/lib/supabase/server";
import { SIDEBAR_COOKIE } from "@/lib/nav/sidebar";
import { isAutoTier } from "@/lib/subscription/isPremium";

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
  // Formule Auto (24/10) : onglet « Boîte » et ses messages non lus.
  let inboxBadge: number | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Présence « en ligne » : envoyée par PresencePing (layout racine) via
      // /api/presence, plus ici -- deux écritures de moins à chaque page.
      const [{ data: swiped }, { data: applications }, { data: plan }, { data: tier }] = await Promise.all([
        supabase.from("swipes").select("offer_id").eq("user_id", user.id).eq("direction", "like"),
        supabase.from("applications").select("offer_id, status").eq("user_id", user.id),
        supabase.from("profiles").select("subscription_status, current_period_end, subscription_price_cents, subscription_interval").eq("id", user.id).maybeSingle(),
        // À part : colonne du SQL du 24/10, une erreur ici ne doit rien casser.
        supabase.from("profiles").select("premium_tier").eq("id", user.id).maybeSingle(),
      ]);
      if (plan && isAutoTier({ ...plan, premium_tier: tier?.premium_tier ?? null })) {
        const { count } = await supabase
          .from("inbox_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("direction", "in")
          .is("read_at", null);
        inboxBadge = count ?? 0;
      }

      // Lettre prête mais candidature pas encore envoyée : reste à faire.
      const appliedOfferIds = new Set((applications ?? []).filter((a) => a.status !== "a_preparer").map((a) => a.offer_id));
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
      <AppShell favoritesBadge={favoritesBadge} inboxBadge={inboxBadge} initialOpen={sidebarOpen}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-8 sm:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </AppShell>
      <BottomNav favoritesBadge={favoritesBadge} inboxBadge={inboxBadge} />
    </div>
  );
}
