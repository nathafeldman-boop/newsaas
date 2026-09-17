import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <OnboardingWizard userId={user.id} initialProfile={profile ?? null} />
      </div>
    </div>
  );
}
