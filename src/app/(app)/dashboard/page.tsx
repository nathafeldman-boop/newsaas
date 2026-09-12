import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { InterviewSimulator } from "@/components/dashboard/InterviewSimulator";
import { CvQuickSend } from "@/components/dashboard/CvQuickSend";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, target_jobs, sectors, cv_path")
    .eq("id", user.id)
    .single();

  const premium = isPremium(profile);

  // Tab entièrement réservée aux Premium (pas de version "aperçu" comme sur
  // /cv) : pas de sens à montrer un tracker de candidatures ou un CV à
  // envoyer à quelqu'un qui n'a pas encore de compte payant actif.
  if (!premium) {
    return (
      <div className="mx-auto w-full max-w-[520px] text-center" style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 40, margin: 0 }}>🎯</p>
        <h1 style={{ fontSize: 24, margin: "12px 0 0" }}>Dashboard Premium</h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            margin: "10px auto 0",
            maxWidth: "36ch",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          Simulateur d&apos;entretien à choix multiples (3 niveaux), suivi de tes candidatures,
          et envoi rapide de ton CV. Réservé aux membres Premium.
        </p>
        <Link href="/premium" className="btn btn-primary mt-5" style={{ whiteSpace: "nowrap" }}>
          🔓 Débloquer avec Premium (7,99€/mois)
        </Link>
      </div>
    );
  }

  const [{ data: applications }, cvSignedUrlResult] = await Promise.all([
    supabase.from("applications").select("status").eq("user_id", user.id),
    profile?.cv_path
      ? supabase.storage.from("cvs").createSignedUrl(profile.cv_path, 60 * 60)
      : Promise.resolve({ data: null }),
  ]);

  const counts = { sent: 0, positive: 0, negative: 0 };
  for (const app of applications ?? []) {
    if (app.status === "entretien" || app.status === "acceptee") counts.positive++;
    else if (app.status === "refusee") counts.negative++;
    else counts.sent++;
  }
  const totalApplications = applications?.length ?? 0;

  const defaultJob = profile?.target_jobs?.[0] || profile?.sectors?.[0] || "";
  const cvSignedUrl = cvSignedUrlResult.data?.signedUrl ?? null;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
        Prépare tes entretiens et suis tes candidatures, au même endroit.
      </p>

      <div className="mt-6">
        <InterviewSimulator isPremium={premium} defaultJob={defaultJob} />
      </div>

      <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>
          📋 Suivi de tes candidatures
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>{totalApplications}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Candidatures
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0, color: "var(--color-accent-2-700)" }}>
              {counts.positive}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Réponses +
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0, color: "var(--color-accent-700)" }}>
              {counts.negative}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Réponses -
            </p>
          </div>
        </div>
        <Link href="/mes-candidatures" style={{ fontSize: 12.5, display: "inline-block", marginTop: 14, color: "var(--color-accent-700)" }}>
          Voir le détail →
        </Link>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Envoyer mon CV</p>
          <CvQuickSend cvSignedUrl={cvSignedUrl} />
        </div>
      </div>

      <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)", opacity: 0.75 }}>
        <div className="flex items-center gap-2">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>📧 Connecter Gmail</p>
          <span className="tag tag-neutral" style={{ fontSize: 10.5 }}>
            À venir
          </span>
        </div>
        <p style={{ fontSize: 13, margin: "6px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Bientôt : connecte ta boîte Gmail pour suivre automatiquement tes candidatures et les
          réponses des recruteurs, sans rien saisir à la main.
        </p>
        <button type="button" disabled className="btn btn-secondary mt-3" style={{ whiteSpace: "nowrap", cursor: "not-allowed" }}>
          Connecter Gmail
        </button>
      </div>
    </div>
  );
}
