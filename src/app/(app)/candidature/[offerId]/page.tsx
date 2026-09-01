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
      <Link href="/favoris" className="text-sm text-brand font-medium">
        ← Retour aux favoris
      </Link>

      <div className="mt-4 rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            {offer.contract_type === "alternance" ? "Alternance" : "Stage"}
          </span>
          {offer.source === "demo" && (
            <span className="text-xs text-foreground/40">
              Offre de démonstration
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold">{offer.title}</h1>
        <p className="mt-1 text-foreground/70">
          {offer.company} · {offer.location}
        </p>

        <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">
          {offer.description}
        </p>

        {offer.requirements && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold">Profil recherché</h2>
            <p className="mt-1 text-sm text-foreground/70">
              {offer.requirements}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/60">
          {offer.duration && (
            <span className="rounded-full border border-border px-2.5 py-1">
              ⏱ {offer.duration}
            </span>
          )}
          {offer.salary && (
            <span className="rounded-full border border-border px-2.5 py-1">
              💶 {offer.salary}
            </span>
          )}
          {offer.remote_policy && (
            <span className="rounded-full border border-border px-2.5 py-1">
              📍 {offer.remote_policy}
            </span>
          )}
        </div>

        {postule === "1" && (
          <p className="mt-5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Candidature enregistrée — ce recruteur n&apos;a pas de lien
            externe, on lui a noté ton intérêt.
          </p>
        )}

        {application ? (
          <p className="mt-6 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
            Tu as déjà postulé à cette offre le{" "}
            {new Date(application.applied_at).toLocaleDateString("fr-FR")}.
          </p>
        ) : (
          <form action={applyAction} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              Postuler maintenant
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
