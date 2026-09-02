import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { applyToOffer } from "./actions";

export default async function CandidaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<{ postule?: string }>;
}) {
  const { offerId } = await params;
  const { postule } = await searchParams;

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

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("offer_id", offerId)
    .maybeSingle();

  const applyAction = applyToOffer.bind(null, offerId);

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

        {postule === "1" && (
          <p className="tag tag-accent-2 mt-5" style={{ padding: "8px 14px", fontSize: 13, display: "block" }}>
            Candidature enregistrée — ce recruteur n&apos;a pas de lien
            externe, on lui a noté ton intérêt.
          </p>
        )}

        {application ? (
          <p className="tag tag-accent mt-6" style={{ padding: "8px 14px", fontSize: 13, display: "block" }}>
            Tu as déjà postulé à cette offre le{" "}
            {new Date(application.applied_at).toLocaleDateString("fr-FR")}.
          </p>
        ) : (
          <form action={applyAction} className="mt-6">
            <button type="submit" className="btn btn-primary btn-block">
              Postuler maintenant
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
