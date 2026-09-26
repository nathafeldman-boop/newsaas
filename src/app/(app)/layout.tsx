import { headers } from "next/headers";
import { AppNav } from "@/components/nav/AppNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { PageTransition } from "@/components/nav/PageTransition";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

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
      // Présence "en ligne" pour le dashboard admin : mise à jour à chaque
      // navigation authentifiée (toutes pages confondues, pas juste les
      // pages soumises au paywall), pas seulement au login -- sinon un
      // compte resterait compté "en ligne" des heures après avoir fermé
      // l'onglet. Volontairement séparée de la mise à jour de
      // last_active_path ci-dessous : un seul appel groupé avait fait
      // échouer les DEUX colonnes (donc "En ligne maintenant" bloqué à 0)
      // tant que la migration ajoutant last_active_path n'était pas encore
      // collée en base -- last_active_at ne doit jamais dépendre d'une
      // colonne annexe pour se mettre à jour.
      const { error: presenceError } = await supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", user.id);
      if (presenceError) {
        console.error("AppLayout presence update failed", presenceError);
      }

      // Page courante pour le dashboard admin ("il est sur quelle page
      // maintenant") -- best-effort : une erreur ici (colonne pas encore
      // migrée en base) ne doit jamais affecter la présence "en ligne"
      // ci-dessus, seulement l'affichage de la page courante sur
      // /admin/online.
      const { error: pathError } = await supabase
        .from("profiles")
        .update({ last_active_path: pathname || null })
        .eq("id", user.id);
      if (pathError) {
        console.error("AppLayout last_active_path update failed", pathError);
      }

      const [{ data: swiped }, { data: applications }] = await Promise.all([
        supabase.from("swipes").select("offer_id, direction, created_at").eq("user_id", user.id),
        supabase.from("applications").select("offer_id").eq("user_id", user.id),
      ]);

      const appliedOfferIds = new Set((applications ?? []).map((a) => a.offer_id));
      const likedOfferIds = new Set(
        (swiped ?? []).filter((s) => s.direction === "like").map((s) => s.offer_id),
      );
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
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav favoritesBadge={favoritesBadge} />
    </div>
  );
}
