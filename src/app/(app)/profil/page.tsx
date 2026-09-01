import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CvAuditPanel } from "@/components/profile/CvAuditPanel";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  let cvSignedUrl: string | null = null;
  if (profile.cv_path) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(profile.cv_path, 60 * 60);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Ton profil</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Ces infos servent à te proposer de meilleures offres.
      </p>
      <div className="mt-6">
        <ProfileForm
          userId={user.id}
          initialProfile={profile}
          cvSignedUrl={cvSignedUrl}
        />
      </div>
      <div className="mt-8">
        <CvAuditPanel hasCv={Boolean(profile.cv_path)} />
      </div>
    </div>
  );
}
