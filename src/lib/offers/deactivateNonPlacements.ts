import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { isNotAPlacementTitle } from "@/lib/offers/classifyContract";

// Offres importées avant une nouvelle règle de classifyContract.ts (postes
// de personnel d'écoles ou de CFA, « centre d'apprentissage »...) : sans ce
// nettoyage, elles resteraient en ligne jusqu'à leur expiration (10 jours
// sans être revues), y compris dans Google Jobs. Lecture des seuls
// intitulés, désactivation (réversible) par lots.
const UPDATE_BATCH = 200;

export async function deactivateNonPlacementOffers(admin: ReturnType<typeof createAdminClient>): Promise<{ deactivated: number; error?: string }> {
  try {
    const rows = await fetchAllRows<{ id: string; title: string }>((from, to) =>
      admin
        .from("offers")
        .select("id, title")
        .eq("is_active", true)
        .in("source", ["france_travail", "adzuna"])
        .order("id")
        .range(from, to),
    );
    const ids = rows.filter((row) => isNotAPlacementTitle(row.title)).map((row) => row.id);
    for (let i = 0; i < ids.length; i += UPDATE_BATCH) {
      const { error } = await admin.from("offers").update({ is_active: false }).in("id", ids.slice(i, i + UPDATE_BATCH));
      if (error) return { deactivated: i, error: error.message };
    }
    return { deactivated: ids.length };
  } catch (err) {
    return { deactivated: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
