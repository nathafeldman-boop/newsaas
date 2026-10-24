import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchFranceTravailOfferStatus } from "@/lib/franceTravail/client";
import { CoverLetterPanel } from "@/components/candidature/CoverLetterPanel";
import { CvOfferMatchPanel } from "@/components/candidature/CvOfferMatchPanel";
import { isPremium } from "@/lib/subscription/isPremium";

// CvOfferMatchPanel ci-dessous déclenche analyzeOfferFitAction, qui appelle Claude
// Opus 5 -- voir le commentaire équivalent dans src/app/(app)/cv/page.tsx
// pour le raisonnement complet (réflexion adaptative activée par défaut,
// donc plus lente que Gemini/Mistral avant lui ; sans ceci la Server Action
// tourne sur le défaut Vercel 10s et se fait tuer avant même que le repli
// statique n'ait sa chance).
export const maxDuration = 60;

export default async function CandidaturePage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/candidature/${offerId}`);

  const { data: offer } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (!offer) notFound();

  // Offre France Travail retirée depuis la dernière synchro (pourvue,
  // suspendue) : vérifié avant d'écrire la lettre, plutôt que de laisser
  // l'étudiant tomber sur « offre en cours d'actualisation » (24/10). Un
  // doute (délai, quota) ne bloque jamais : on garde l'état en base.
  const liveStatus =
    offer.source === "france_travail" && offer.external_id ? await fetchFranceTravailOfferStatus(offer.external_id) : "unknown";
  const gone = liveStatus === "gone" || (!offer.is_active && liveStatus !== "live");
  if (liveStatus !== "unknown" && offer.is_active !== (liveStatus === "live")) {
    after(async () => {
      const { error } = await createAdminClient().from("offers").update({ is_active: liveStatus === "live" }).eq("id", offer.id);
      console.log("candidature: offre France Travail", JSON.stringify({ offerId: offer.id, liveStatus, error: error?.message ?? null }));
    });
  }

  const [{ data: application }, { data: profile }] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .eq("offer_id", offerId)
      .maybeSingle(),
    supabase.from("profiles").select("subscription_status, current_period_end, cv_text").eq("id", user.id).single(),
  ]);
  const canAnalyzeOfferFit = isPremium(profile) && !!profile?.cv_text;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/favoris" style={{ fontSize: 14 }}>
        ← Retour aux favoris
      </Link>

      <div className="card elev-sm mt-4" style={{ padding: "var(--space-6)" }}>
        <div className="flex items-center justify-between">
          <span className="tag tag-accent">
            {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
          </span>
          {offer.source === "demo" && (
            <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
              Offre de démonstration
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 26, margin: "12px 0 0" }}>{offer.title}</h1>
        <p style={{ margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          {offer.company} · {offer.location}
        </p>

        <p style={{ marginTop: 16, whiteSpace: "pre-line", fontSize: 14, color: "color-mix(in srgb, var(--color-text) 80%, transparent)" }}>
          {offer.description}
        </p>

        {offer.requirements && (
          <div className="mt-4">
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Profil recherché</h2>
            <p style={{ marginTop: 4, fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
              {offer.requirements}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {offer.duration && <span className="tag tag-neutral">{offer.duration}</span>}
          {offer.salary && <span className="tag tag-neutral">{offer.salary}</span>}
          {offer.remote_policy && <span className="tag tag-neutral">{offer.remote_policy}</span>}
        </div>

        {application && (
          <p className="tag tag-accent mt-6" style={{ padding: "8px 14px", fontSize: 13, display: "block" }}>
            Tu as déjà postulé à cette offre le{" "}
            {new Date(application.applied_at).toLocaleDateString("fr-FR")}.
          </p>
        )}

        {gone ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="tag tag-accent-2" style={{ padding: "12px 14px", fontSize: 14, display: "block", lineHeight: 1.5 }}>
              <strong>Trop tard pour celle-ci :</strong> le recruteur vient de la retirer (poste pourvu ou annonce suspendue).
              Les offres partent vite, postule dès qu&apos;une nouvelle tombe.
            </p>
            <Link href="/swipe" className="btn btn-primary btn-block">
              Voir les offres publiées aujourd&apos;hui
            </Link>
          </div>
        ) : (
          <>
            <CoverLetterPanel
              userId={user.id}
              offerId={offerId}
              applyUrl={offer.apply_url}
              initialLetter={application?.cover_note ?? null}
            />

            {canAnalyzeOfferFit && <CvOfferMatchPanel offerId={offerId} />}
          </>
        )}
      </div>
    </div>
  );
}
