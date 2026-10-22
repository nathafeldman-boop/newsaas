import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

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
  const { count: trustCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_completed", true);

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <OnboardingWizard
          userId={user.id}
          initialProfile={profile ?? null}
          trustCount={trustCount ?? 0}
        />
      </div>
    </div>
  );
}
