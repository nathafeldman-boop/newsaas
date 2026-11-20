import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requestNow } from "@/lib/applications/status";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { ProofData } from "@/components/onboarding/ProofScreens";
import { getPublicReviewStats, getPublicTestimonials } from "@/lib/reviews/publicStats";
import { onboardingVariant } from "@/lib/onboarding/steps";
import { pinnedOfferId, PINNED_OFFER_COOKIE } from "@/lib/offers/pinnedOffer";
import { locationFromOffer } from "@/lib/onboarding/options";
import type { ContractType } from "@/types/database";

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
  const contracts = ["cdi", "cdd", "alternance", "stage", "stage_scolaire"] as const;
  const [testimonials, reviewStats, weeklySignups, activeOffers, totalUsers, ...byContract] = await Promise.all([
    getPublicTestimonials(6).catch(() => []),
    getPublicReviewStats().catch(() => ({ count: 0, average: null })),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)).catch(() => null),
    count(admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true)).catch(() => null),
    count(admin.from("profiles").select("id", { count: "exact", head: true })).catch(() => null),
    ...contracts.map((c) => count(admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true).eq("contract_type", c)).catch(() => null)),
  ]);
  const offersByContract: Partial<Record<string, number>> = {};
  contracts.forEach((c, i) => {
    const n = byContract[i];
    if (typeof n === "number") offersByContract[c] = n;
  });
  return { testimonials, reviewStats, weeklySignups, activeOffers, offersByContract, totalUsers };
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

  // Page d'arrivée (18/11) : recopiée une fois, sur un compte créé dans les 24 h.
  const landing = (await cookies()).get("landing")?.value;
  // Groupe du test A/B d'entrée (lib/ab/entry.ts), noté avec la page d'arrivée.
  const abRaw = (await cookies()).get("ab_entry")?.value;
  const abEntry = abRaw === "lp" || abRaw === "inscription" ? abRaw : null;
  if (profile && !profile.landing_path && landing && requestNow() - Date.parse(profile.created_at) < 86_400_000) {
    after(async () => {
      const { error } = await createAdminClient().from("profiles").update({ landing_path: landing.slice(0, 200), ab_entry: abEntry }).eq("id", user.id).is("landing_path", null);
      if (error && !/landing_path/.test(error.message)) console.error("onboarding: page d'arrivée non notée", error.message);
    });
  }

  // Chiffre réel (jamais inventé, voir CLAUDE.md) affiché à l'étape "trust" :
  // admin client car RLS n'autorise pas un utilisateur à compter les profils
  // des autres (même pattern que les stats de la landing page).
  const admin = createAdminClient();
  // Arrivé depuis une fiche offre (cookie offre_vue, 20/11) : contrat et
  // ville repris de cette offre, écrans correspondants sautés (version A).
  const pinnedId = profile?.onboarding_completed ? null : pinnedOfferId((await cookies()).get(PINNED_OFFER_COOKIE)?.value);
  const [{ count: trustCount }, proof, pinned] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
    loadProof(),
    pinnedId
      ? admin.from("offers").select("contract_type, location, title, company").eq("id", pinnedId).eq("is_active", true).maybeSingle().then((r) => r.data, () => null)
      : Promise.resolve(null),
  ]);
  const pinnedContract = pinned?.contract_type as ContractType | undefined;
  const fromOffer =
    pinnedContract && ["cdi", "cdd", "alternance", "stage"].includes(pinnedContract)
      ? { contract: pinnedContract, city: locationFromOffer(pinned?.location), title: pinned?.title ?? null, company: pinned?.company ?? null }
      : null;

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <OnboardingWizard
          userId={user.id}
          initialProfile={profile ?? null}
          trustCount={trustCount ?? 0}
          proof={proof}
          variant={onboardingVariant(user.id, profile?.created_at)}
          fromOffer={fromOffer}
        />
      </div>
    </div>
  );
}
