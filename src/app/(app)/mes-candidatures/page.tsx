import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApplicationStatusControl } from "@/components/candidature/ApplicationStatusControl";

function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
          className="card elev-sm mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-5"
          style={{ padding: "var(--space-4) var(--space-6)" }}
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

      {applications && applications.length > 0 && (
        <div className="mt-3 flex" style={{ gap: 3, height: 8, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ flex: counts.envoyee, background: "var(--color-accent)" }} />
          <div style={{ flex: counts.entretien, background: "var(--color-accent-2)" }} />
          <div style={{ flex: counts.acceptee, background: "var(--color-accent-2-700)" }} />
          <div style={{ flex: counts.refusee, background: "var(--color-neutral-400)" }} />
        </div>
      )}

      {!applications || applications.length === 0 ? (
        <p className="mt-10 text-center" style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Aucune candidature envoyée pour l&apos;instant.
        </p>
      ) : (
        <div
          className="mt-6"
          style={{
            background: "var(--color-surface)",
            borderRadius: 22,
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
          {applications.map((app, i) => {
            const offer = offerById.get(app.offer_id);
            if (!offer) return null;
            return (
              <div
                key={app.id}
                className="flex items-center gap-3"
                style={{
                  padding: "14px 16px",
                  borderBottom: i < applications.length - 1 ? "1px solid var(--color-divider)" : "none",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "var(--color-accent-100)",
                    color: "var(--color-accent-700)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {companyInitials(offer.company)}
                </div>
                <Link
                  href={`/candidature/${offer.id}`}
                  className="no-underline"
                  style={{ color: "inherit", minWidth: 0, flex: 1 }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {offer.title}
                  </p>
                  <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                    {offer.company} · {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                  </p>
                </Link>
                <ApplicationStatusControl applicationId={app.id} status={app.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
