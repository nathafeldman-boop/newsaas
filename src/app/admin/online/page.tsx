import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "à l'instant";
  if (mins === 1) return "il y a 1 min";
  return `il y a ${mins} min`;
}

export default async function AdminOnlinePage() {
  // Même fenêtre que la tuile "En ligne maintenant" du dashboard : voir
  // src/app/admin/page.tsx pour l'explication (last_active_at retapé à
  // chaque navigation dans (app)/layout.tsx).
  const onlineSince = new Date();
  onlineSince.setMinutes(onlineSince.getMinutes() - 5);

  const admin = createAdminClient();
  const { data: users, error: usersError } = await admin
    .from("profiles")
    .select("id, email, full_name, subscription_status, last_active_at, last_active_path")
    .gte("last_active_at", onlineSince.toISOString())
    .order("last_active_at", { ascending: false });

  // supabase-js ne throw jamais sur une erreur Postgres -- sans ce log,
  // une requête qui échoue (ex: colonne pas encore migrée) afficherait
  // silencieusement "Personne en ligne" même si des gens le sont.
  if (usersError) console.error("AdminOnlinePage: users query failed", usersError);

  const online = users ?? [];

  return (
    <div>
      <Link
        href="/admin"
        style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
      >
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 26, margin: "10px 0 6px" }}>En ligne maintenant</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        {online.length} utilisateur{online.length > 1 ? "s" : ""} actif{online.length > 1 ? "s" : ""} dans les 5
        dernières minutes.
      </p>

      <div className="flex flex-col gap-2.5">
        {online.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="card flex-row items-center justify-between no-underline"
            style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
          >
            <div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{u.full_name || "—"}</p>
              <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                {u.email} · {timeAgo(u.last_active_at)}
              </p>
            </div>
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              {u.last_active_path && (
                <span className="tag tag-neutral" style={{ fontFamily: "monospace" }}>
                  {u.last_active_path}
                </span>
              )}
              {isPremium(u) && <span className="tag tag-accent">Premium</span>}
            </div>
          </Link>
        ))}
        {online.length === 0 && (
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Personne en ligne pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
