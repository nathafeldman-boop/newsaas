import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvUploadPanel } from "@/components/profile/CvUploadPanel";
import { CvAuditPanel } from "@/components/profile/CvAuditPanel";
import { CvGuideModule } from "@/components/profile/CvGuideModule";
import { isPremium } from "@/lib/subscription/isPremium";

// CvAuditPanel ci-dessous déclenche auditCvAction (cv-audit-actions.ts), qui
// appelle Claude Opus 5 -- réflexion adaptative activée par défaut
// (contrairement à Gemini/Mistral avant lui), donc nettement plus lente.
// Sans ceci, la Server Action tourne sur le défaut Vercel (10s, plan Hobby),
// plus court que le timeout interne (ANTHROPIC_TIMEOUT_MS, 30s) : la
// fonction se fait tuer par la plateforme avant même que ce timeout ou le
// repli statique n'aient la moindre chance de s'exécuter -- aucune erreur
// propre, juste un échec sec côté utilisateur malgré une clé API valide et
// créditée. Root cause probable du souci signalé par Nathan le 26/09
// ("l'IA ne marche pas"). Même correctif déjà appliqué à l'ingestion en lot
// (voir admin/offres/page.tsx) pour la même raison.
export const maxDuration = 60;

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cv");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path, subscription_status, sectors, target_jobs")
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

      <CvAuditPanel userId={user.id} hasCv={Boolean(profile.cv_path)} isPremium={isPremium(profile)} />

      <CvGuideModule
        userId={user.id}
        targetLabel={profile.target_jobs?.[0] || profile.sectors?.[0] || null}
        isPremium={isPremium(profile)}
      />
    </div>
  );
}
