import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvUploadPanel } from "@/components/profile/CvUploadPanel";
import { CvGuideModule } from "@/components/profile/CvGuideModule";
import { isPremium } from "@/lib/subscription/isPremium";

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cv");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path, subscription_status, current_period_end, sectors, target_jobs")
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
        Un CV à jour améliore tes matchs. Tes CV partent de modèles écrits à la main : on n&apos;utilise pas d&apos;IA pour tes candidatures.
      </p>

      <Link
        href="/cv/modeles"
        className="card elev-sm mt-6 flex items-center gap-3"
        style={{ flexDirection: "row", padding: "14px 16px", textDecoration: "none", color: "inherit", border: "1.5px solid var(--color-accent)", background: "var(--color-accent-100)" }}
      >
        <span aria-hidden style={{ fontSize: 28 }}>
          📄
        </span>
        <span style={{ flex: 1 }}>
          <strong style={{ display: "block", fontSize: 15 }}>Crée ton CV avec un modèle</strong>
          <span style={{ fontSize: 13 }}>Prêt pour ton métier, avec les mots-clés que les recruteurs cherchent. PDF en 2 minutes.</span>
        </span>
        <span aria-hidden style={{ fontWeight: 800 }}>
          →
        </span>
      </Link>

      <div className="mt-4">
        <CvUploadPanel userId={user.id} cvSignedUrl={cvSignedUrl} />
      </div>

      <CvGuideModule
        userId={user.id}
        targetLabel={profile.target_jobs?.[0] || profile.sectors?.[0] || null}
        isPremium={isPremium(profile)}
      />
    </div>
  );
}
