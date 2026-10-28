import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { isPremium } from "@/lib/subscription/isPremium";
import type { Profile } from "@/types/database";

// Abonnés encore en recherche (28/10, aide après le paiement : relances,
// alertes d'offres fraîches, résumé du matin). Filtre de base fait par la
// base, revérifié avec isPremium (période payée comprise).
export async function loadSearchingSubscribers(admin: ReturnType<typeof createAdminClient>): Promise<Profile[]> {
  const rows = await fetchAllRowsByIdCursor<Profile>((afterId, limit) => {
    let q = admin
      .from("profiles")
      .select("*")
      .in("subscription_status", ["active", "trialing", "lifetime", "comp"])
      .is("search_completed_at", null)
      .not("email", "is", null);
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit) as unknown as PromiseLike<{ data: Profile[] | null; error: { message: string } | null }>;
  });
  return rows.filter((p) => isPremium(p));
}
