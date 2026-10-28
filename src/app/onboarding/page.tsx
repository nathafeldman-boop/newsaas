import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { ProofData } from "@/components/onboarding/ProofScreens";
import { getPublicReviewStats, getPublicTestimonials } from "@/lib/reviews/publicStats";

// Écrans de preuve (28/10) : uniquement des chiffres lus en base (avis
// approuvés, inscrits de la semaine, offres actives). Une
// lecture qui échoue laisse l'écran se replier sur ce qui reste, jamais
// d'onboarding cassé.
async function loadProof(): Promise<ProofData> {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: n, error } = await query;
    return error ? null : (n ?? 0);
  };
  const [testimonials, reviewStats, weeklySignups, activeOffers] = await Promise.all([
    getPublicTestimonials(6).catch(() => []),
    getPublicReviewStats().catch(() => ({ count: 0, average: null })),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)).catch(() => null),
    count(admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true)).catch(() => null),
  ]);
  return { testimonials, reviewStats, weeklySignups, activeOffers };
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/swipe");
  }

  // Chiffre réel (jamais inventé, voir CLAUDE.md) affiché à l'étape "trust" :
  // admin client car RLS n'autorise pas un utilisateur à compter les profils
  // des autres (même pattern que les stats de la landing page).
  const admin = createAdminClient();
  const [{ count: trustCount }, proof] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
    loadProof(),
  ]);

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <OnboardingWizard
          userId={user.id}
          initialProfile={profile ?? null}
          trustCount={trustCount ?? 0}
          proof={proof}
        />
      </div>
    </div>
  );
}
