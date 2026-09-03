import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav/AppNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { PageTransition } from "@/components/nav/PageTransition";
import { createClient } from "@/lib/supabase/server";
import { computeQuotaStatus } from "@/lib/subscription/quota";
import { isAdminEmail } from "@/lib/admin/assertAdmin";

// Pages où on ne redirige jamais vers /premium, même quota dépassé : la page
// premium elle-même (boucle infinie sinon), et candidater (/candidature) qui
// doit rester illimité même quota de swipe atteint — exactement comme le
// trigger SQL enforce_swipe_quota l'autorise déjà côté base pour les mêmes
// raisons. /favoris et /mes-candidatures doivent l'être aussi : ce sont les
// seuls chemins pour atteindre /candidature une fois le quota de swipe
// atteint (impossible de retomber sur une offre déjà likée depuis /swipe,
// qui affiche l'écran de blocage) -- sans eux, "candidater reste illimité"
// n'avait en pratique aucun moyen d'être atteint. /admin vit hors de ce
// groupe de routes désormais, donc n'a plus besoin d'exemption ici.
const PAYWALL_EXEMPT_PATHS = ["/premium", "/candidature", "/favoris", "/mes-candidatures"];

function isExempt(pathname: string) {
  return PAYWALL_EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  let shouldRedirectToPaywall = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Présence "en ligne" pour le dashboard admin : mise à jour à chaque
      // navigation authentifiée (toutes pages confondues, pas juste les
      // pages soumises au paywall), pas seulement au login -- sinon un
      // compte resterait compté "en ligne" des heures après avoir fermé
      // l'onglet.
      const { error: presenceError } = await supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", user.id);
      if (presenceError) {
        // Ne jamais laisser passer une erreur silencieuse ici : supabase-js
        // ne throw pas sur une erreur Postgres (ex: colonne manquante si la
        // migration n'a pas encore été collée en base), donc sans ce log le
        // dashboard admin afficherait "En ligne maintenant" à 0 en
        // permanence sans aucune trace de pourquoi.
        console.error("AppLayout presence update failed", presenceError);
      }

      if (!isExempt(pathname) && !isAdminEmail(user.email)) {
        const [{ data: profile }, { data: swiped }, { data: applications }] = await Promise.all([
          supabase.from("profiles").select("subscription_status").eq("id", user.id).single(),
          supabase.from("swipes").select("offer_id, created_at").eq("user_id", user.id),
          supabase.from("applications").select("offer_id").eq("user_id", user.id),
        ]);

        shouldRedirectToPaywall = computeQuotaStatus(
          profile,
          swiped ?? [],
          applications ?? [],
        ).quotaReached;
      }
    }
  } catch (err) {
    // Ce check tourne sur CHAQUE navigation de l'appli : un pépin
    // transitoire (Supabase lent/indisponible un instant) ne doit jamais
    // faire planter toute la page -- on laisse passer plutôt que
    // d'afficher un écran blanc, quitte à revoir le paywall à la
    // prochaine navigation si le quota est réellement dépassé.
    console.error("AppLayout quota check failed", err);
  }

  if (shouldRedirectToPaywall) {
    redirect("/premium?limite=1");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
