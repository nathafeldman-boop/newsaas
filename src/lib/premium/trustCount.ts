import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Vrai nombre de comptes qui ont terminé l'onboarding (même chiffre que
// l'étape « Confiance » de l'onboarding), en cache 1 h : affiché avant le
// paywall, jamais un chiffre inventé.
export const getTrustCount = unstable_cache(
  async (): Promise<number> => {
    const { count, error } = await createAdminClient()
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("onboarding_completed", true);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  ["premium-trust-count-v1"],
  { revalidate: 3600 },
);
