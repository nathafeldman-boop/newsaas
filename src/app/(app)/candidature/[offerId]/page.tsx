import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchFranceTravailOfferStatus } from "@/lib/franceTravail/client";
import { CoverLetterPanel } from "@/components/candidature/CoverLetterPanel";
import { CvOfferMatchPanel } from "@/components/candidature/CvOfferMatchPanel";
import { ReportOfferButton } from "@/components/candidature/ReportOfferButton";
import { isPremium } from "@/lib/subscription/isPremium";
import { STATUS_LABELS } from "@/lib/applications/status";
import type { Application } from "@/types/database";

// Date d'envoi à afficher sous « Postuler sur le site ». Une candidature
// « envoyée » sans date d'envoi date d'avant le 24/10, quand ouvrir la page
// suffisait à la noter envoyée : on redemande la confirmation.
function sentAtForPanel(application: Application | null): string | null {
  if (!application || application.status === "a_preparer" || application.status === "cloturee") return null;
  if (application.status === "envoyee" && !application.sent_at) return null;
  return application.sent_at ?? application.applied_at;
}

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

  // Offre plus en ligne : la règle RLS ne laisse lire que les offres
  // actives, la page tombait en 404 et l'étudiant perdait sa candidature et
  // sa lettre (24/10). Relue en service_role : c'est une annonce publique,
  // affichée comme retirée.
  const { data: liveOffer } = await supabase.from("offers").select("*").eq("id", offerId).maybeSingle();
  const offer = liveOffer ?? (await createAdminClient().from("offers").select("*").eq("id", offerId).maybeSingle()).data;

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
    supabase
      .from("profiles")
      .select("subscription_status, current_period_end, cv_text, full_name, city, formation, skills, availability_date")
      .eq("id", user.id)
      .single(),
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

        {application && application.status !== "a_preparer" && (application.status !== "envoyee" || application.sent_at || gone) && (
          <p className="tag tag-accent mt-6" style={{ padding: "8px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
            Dans ton suivi : <strong>{STATUS_LABELS[application.status]}</strong>
            {application.sent_at ? ` · envoyée le ${new Date(application.sent_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}` : ""}.{" "}
            <Link href="/mes-candidatures">Mettre à jour</Link>
          </p>
        )}

        {gone ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="tag tag-accent-2" style={{ padding: "12px 14px", fontSize: 14, display: "block", lineHeight: 1.5 }}>
              <strong>Trop tard pour celle-ci :</strong> le recruteur vient de la retirer (poste pourvu ou annonce suspendue).
              Les offres partent vite, postule dès qu&apos;une nouvelle tombe.
            </p>
            {application?.cover_note && (
              <details className="card" style={{ padding: 12 }}>
                <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Ta lettre pour cette offre</summary>
                <p style={{ whiteSpace: "pre-line", fontSize: 13, lineHeight: 1.55, margin: "8px 0 0" }}>{application.cover_note}</p>
              </details>
            )}
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
              initialSentAt={sentAtForPanel(application)}
              templateContext={{
                offer: { title: offer.title, company: offer.company, contractType: offer.contract_type, sector: offer.sector },
                profile: {
                  fullName: profile?.full_name ?? null,
                  city: profile?.city ?? null,
                  formation: profile?.formation ?? null,
                  skills: profile?.skills ?? [],
                  availabilityDate: profile?.availability_date ?? null,
                },
              }}
            />

            {canAnalyzeOfferFit && <CvOfferMatchPanel offerId={offerId} />}

            {offer.source === "france_travail" && (
              <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                ℹ️ Offre France Travail : pour postuler sur leur site, il faut te connecter à ton compte France Travail (gratuit, 1 minute à créer si tu n&apos;en as pas).
              </p>
            )}

            <ReportOfferButton offerId={offerId} />
          </>
        )}
      </div>
    </div>
  );
}
