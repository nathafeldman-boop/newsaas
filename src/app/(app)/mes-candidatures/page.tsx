import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  envoyee: "bg-brand/10 text-brand-dark",
  en_cours: "bg-amber-100 text-amber-700",
  entretien: "bg-blue-100 text-blue-700",
  acceptee: "bg-green-100 text-green-700",
  refusee: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "Envoyée",
  en_cours: "En cours",
  entretien: "Entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

export default async function MesCandidaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mes-candidatures");

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  const offerIds = (applications ?? []).map((a) => a.offer_id);
  const { data: offers } = offerIds.length
    ? await supabase.from("offers").select("*").in("id", offerIds)
    : { data: [] as never[] };

  const offerById = new Map((offers ?? []).map((o) => [o.id, o]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Mes candidatures</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Le suivi de toutes les offres auxquelles tu as postulé.
      </p>

      {!applications || applications.length === 0 ? (
        <p className="mt-10 text-center text-foreground/60">
          Aucune candidature envoyée pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => {
            const offer = offerById.get(app.offer_id);
            if (!offer) return null;
            return (
              <Link
                key={app.id}
                href={`/candidature/${offer.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:border-brand/40 transition-colors"
              >
                <div>
                  <p className="font-semibold">{offer.title}</p>
                  <p className="text-sm text-foreground/60">
                    {offer.company} · {offer.location}
                  </p>
                  <p className="mt-1 text-xs text-foreground/40">
                    Postulé le{" "}
                    {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}
                >
                  {STATUS_LABELS[app.status]}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
