import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { InterviewSimulator } from "@/components/dashboard/InterviewSimulator";
import { CvQuickSend } from "@/components/dashboard/CvQuickSend";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { computeMatchScore } from "@/lib/matching/score";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { buildActionPlan } from "@/lib/dashboard/actionPlan";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
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
        <PremiumCtaLink
          userId={user.id}
          source="dashboard_gate"
          className="btn btn-primary mt-5"
          style={{ whiteSpace: "nowrap" }}
        >
          🔓 Débloquer avec Premium (7,99€/mois)
        </PremiumCtaLink>
      </div>
    );
  }

  const [{ data: applications }, cvSignedUrlResult, { data: likedSwipes }, todayOffers] =
    await Promise.all([
      supabase.from("applications").select("offer_id, status, applied_at").eq("user_id", user.id),
      profile?.cv_path
        ? supabase.storage.from("cvs").createSignedUrl(profile.cv_path, 60 * 60)
        : Promise.resolve({ data: null }),
      supabase.from("swipes").select("offer_id").eq("user_id", user.id).eq("direction", "like"),
      (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return fetchActiveOffers(supabase, {
          sectors: profile && profile.sectors.length > 0 ? profile.sectors : [],
          publishedAfter: todayStart.toISOString(),
          limit: 300,
        });
      })(),
    ]);

  const counts = { sent: 0, positive: 0, negative: 0 };
  for (const app of applications ?? []) {
    if (app.status === "entretien" || app.status === "acceptee") counts.positive++;
    else if (app.status === "refusee") counts.negative++;
    else counts.sent++;
  }
  const totalApplications = applications?.length ?? 0;

  // Plan d'action (RETENTION_AUDIT.md) : calculé ici, purement à partir de
  // vraies données -- jamais de compteur générique/factice.
  const appliedOfferIds = new Set((applications ?? []).map((a) => a.offer_id));
  const likedOfferIds = new Set((likedSwipes ?? []).map((s) => s.offer_id));
  const offersToApplyCount = [...likedOfferIds].filter((id) => !appliedOfferIds.has(id)).length;

  // Même seuil que le digest email de nouvelles offres (notify-new-offers) :
  // n'annonce que ce qui vaudrait aussi sa place dans un feed pertinent.
  const MIN_SCORE_FOR_PLAN = 58;
  const newMatchingOffersCount = profile
    ? (todayOffers ?? []).filter((o) => computeMatchScore(profile, o) >= MIN_SCORE_FOR_PLAN).length
    : 0;

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - 7);
  const staleApplicationsCount = (applications ?? []).filter(
    (a) =>
      (a.status === "envoyee" || a.status === "en_cours") &&
      new Date(a.applied_at) < staleCutoff,
  ).length;

  const actionPlan = buildActionPlan({ newMatchingOffersCount, offersToApplyCount, staleApplicationsCount });

  const defaultJobHint = profile?.target_jobs?.[0] || profile?.sectors?.[0] || "";
  const cvSignedUrl = cvSignedUrlResult.data?.signedUrl ?? null;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
        Prépare tes entretiens et suis tes candidatures, au même endroit.
      </p>

      {actionPlan.length > 0 && (
        <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🎯 Aujourd&apos;hui</p>
          <div className="flex flex-col gap-2.5" style={{ marginTop: 12 }}>
            {actionPlan.map((item) => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span aria-hidden style={{ fontSize: 15, lineHeight: 1.4 }}>
                  {item.icon}
                </span>
                <p style={{ fontSize: 13.5, lineHeight: 1.4, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2" style={{ marginTop: 14 }}>
            <Link href="/swipe" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
              Voir les offres
            </Link>
            <Link href="/favoris" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
              Mes favoris
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6">
        <InterviewSimulator userId={user.id} isPremium={premium} defaultJobHint={defaultJobHint} />
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
        {totalApplications > 0 && (
          <div className="flex" style={{ gap: 3, height: 6, marginTop: 12, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ flex: counts.sent, background: "var(--color-accent)" }} />
            <div style={{ flex: counts.positive, background: "var(--color-accent-2)" }} />
            <div style={{ flex: counts.negative, background: "var(--color-neutral-400)" }} />
          </div>
        )}
        <Link href="/mes-candidatures" style={{ fontSize: 12.5, display: "inline-block", marginTop: 14, color: "var(--color-accent-700)" }}>
          Voir le détail →
        </Link>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Envoyer mon CV</p>
          <CvQuickSend cvSignedUrl={cvSignedUrl} />
        </div>
      </div>

      {/* La connexion Gmail est en réalité déjà disponible (GmailConnectionPanel
          sur /profil) -- cette carte affichait "À venir" avec un bouton
          désactivé, ce qui faisait croire à une fonctionnalité inexistante
          alors qu'elle est live ailleurs. Corrigé pour pointer vers la vraie
          fonctionnalité plutôt que la dupliquer ici (état de connexion déjà
          géré sur /profil). Trouvé à l'audit du 2026-09-25. */}
      <Link
        href="/profil"
        className="card elev-sm mt-5 no-underline"
        style={{ padding: "var(--space-6)", color: "inherit", display: "block" }}
      >
        <div className="flex items-center gap-2">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>📧 Connecter Gmail</p>
        </div>
        <p style={{ fontSize: 13, margin: "6px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Suis automatiquement tes candidatures et les réponses des recruteurs, sans rien saisir à
          la main. Disponible depuis ton profil.
        </p>
        <span className="btn btn-secondary mt-3" style={{ whiteSpace: "nowrap" }}>
          Aller sur mon profil →
        </span>
      </Link>
    </div>
  );
}
