import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvUploadPanel } from "@/components/profile/CvUploadPanel";
import { CvAuditPanel } from "@/components/profile/CvAuditPanel";
import { isPremium } from "@/lib/subscription/isPremium";

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cv");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path, subscription_status")
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
    <div className="mx-auto w-full max-w-[520px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Ton CV</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "2px 0 0" }}>
        Un CV à jour améliore tes matchs et débloque l&apos;audit Premium.
      </p>

      <div className="mt-6">
        <CvUploadPanel userId={user.id} cvSignedUrl={cvSignedUrl} />
      </div>

      <CvAuditPanel hasCv={Boolean(profile.cv_path)} isPremium={isPremium(profile)} />
    </div>
  );
}
