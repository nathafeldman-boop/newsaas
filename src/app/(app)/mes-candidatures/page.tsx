import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

const STATUS_TAG_CLASS: Record<ApplicationStatus, string> = {
  envoyee: "tag tag-accent",
  en_cours: "tag tag-neutral",
  entretien: "tag tag-outline",
  acceptee: "tag tag-accent-2",
  refusee: "tag tag-neutral",
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

  const counts = {
    envoyee: 0,
    entretien: 0,
    acceptee: 0,
    refusee: 0,
  };
  for (const app of applications ?? []) {
    if (app.status === "envoyee" || app.status === "en_cours") counts.envoyee++;
    else if (app.status === "entretien") counts.entretien++;
    else if (app.status === "acceptee") counts.acceptee++;
    else if (app.status === "refusee") counts.refusee++;
  }

  return (
    <div>
      <h1 style={{ fontSize: 30, margin: 0 }}>Mes candidatures</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Le suivi de toutes les offres auxquelles tu as postulé.
      </p>

      {applications && applications.length > 0 && (
        <div
          className="card elev-sm mt-6 grid gap-5"
          style={{
            gridTemplateColumns: "repeat(4,auto)",
            justifyContent: "space-between",
            padding: "var(--space-4) var(--space-6)",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent)", margin: 0 }}>
              {counts.envoyee}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Envoyées
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0 }}>{counts.entretien}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Entretiens
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0 }}>{counts.acceptee}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Acceptées
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0 }}>{counts.refusee}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Refusées
            </p>
          </div>
        </div>
      )}

      {!applications || applications.length === 0 ? (
        <p className="mt-10 text-center" style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Aucune candidature envoyée pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3.5">
          {applications.map((app) => {
            const offer = offerById.get(app.offer_id);
            if (!offer) return null;
            return (
              <Link
                key={app.id}
                href={`/candidature/${offer.id}`}
                className="card flex-row items-center justify-between no-underline"
                style={{ color: "inherit" }}
              >
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{offer.title}</p>
                  <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                    {offer.company} · {offer.location}
                  </p>
                  <p style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)", margin: "4px 0 0" }}>
                    Postulé le {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={STATUS_TAG_CLASS[app.status]}>{STATUS_LABELS[app.status]}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
