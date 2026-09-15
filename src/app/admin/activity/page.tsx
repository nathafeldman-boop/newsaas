import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const EVENT_LABEL: Record<string, string> = {
  button_click: "Clic bouton",
  login: "Connexion",
  onboarding_step_viewed: "Étape onboarding vue",
  onboarding_step_completed: "Étape onboarding terminée",
};

function fmt(date: string): string {
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Paris",
  });
}

function describe(eventType: string, metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  if (eventType === "button_click") {
    const button = typeof metadata.button === "string" ? metadata.button : "?";
    const source = typeof metadata.source === "string" ? ` · source: ${metadata.source}` : "";
    const path = typeof metadata.path === "string" ? ` · depuis ${metadata.path}` : "";
    return `${button}${source}${path}`;
  }
  if (eventType === "onboarding_step_viewed" || eventType === "onboarding_step_completed") {
    return typeof metadata.step === "string" ? `étape: ${metadata.step}` : "—";
  }
  return "—";
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const admin = createAdminClient();

  // Feed brut récent (button_click + login + onboarding) : suffisant pour
  // voir "qui a fait quoi, là, maintenant" sans jamais ramener toute la
  // table user_events (qui grossit indéfiniment avec l'usage).
  let query = admin
    .from("user_events")
    .select("id, user_id, event_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  if (type) query = query.eq("event_type", type);
  const { data: events, error } = await query;

  if (error) console.error("AdminActivityPage: events query failed", error);

  const rows = events ?? [];
  const userIds = [...new Set(rows.map((e) => e.user_id))];
  const profileById = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    if (profilesError) {
      console.error("AdminActivityPage: profiles query failed", profilesError);
    } else {
      for (const p of profiles ?? []) profileById.set(p.id, p);
    }
  }

  const types = ["button_click", "login", "onboarding_step_viewed", "onboarding_step_completed"];

  return (
    <div>
      <Link
        href="/admin"
        style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
      >
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 26, margin: "10px 0 6px" }}>Activité récente</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 16px" }}>
        Les 150 derniers événements (clics, connexions, onboarding), tous utilisateurs confondus.
      </p>

      <div className="seg mb-4" style={{ display: "inline-flex", flexWrap: "wrap" }}>
        <Link href="/admin/activity" className={`seg-opt${!type ? " is-active" : ""}`} style={{ padding: "8px 14px" }}>
          Tout
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/admin/activity?type=${t}`}
            className={`seg-opt${type === t ? " is-active" : ""}`}
            style={{ padding: "8px 14px" }}
          >
            {EVENT_LABEL[t] ?? t}
          </Link>
        ))}
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Quand</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Qui</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Événement</th>
                <th style={{ padding: "10px 12px", fontWeight: 500 }}>Détail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const author = profileById.get(e.user_id);
                return (
                  <tr key={e.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{fmt(e.created_at)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Link href={`/admin/users/${e.user_id}`}>
                        {author?.full_name || author?.email || e.user_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span className="tag tag-neutral">{EVENT_LABEL[e.event_type] ?? e.event_type}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                      {describe(e.event_type, e.metadata as Record<string, unknown> | null)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p style={{ fontSize: 14, padding: "var(--space-5)", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun événement pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
