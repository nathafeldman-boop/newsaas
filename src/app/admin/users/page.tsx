import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const admin = createAdminClient();
  const { data: users, count } = await admin
    .from("profiles")
    .select("id, email, full_name, subscription_status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Utilisateurs</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        {count ?? 0} inscrit(s) au total.
      </p>

      <div className="flex flex-col gap-2.5">
        {(users ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="card flex-row items-center justify-between no-underline"
            style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
          >
            <div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{u.full_name || "—"}</p>
              <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                {u.email} · {new Date(u.created_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
              </p>
            </div>
            {isPremium(u) && <span className="tag tag-accent">Premium</span>}
          </Link>
        ))}
        {(!users || users.length === 0) && (
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun utilisateur.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/users?page=${p}`}
              className={`btn btn-secondary btn-icon${p === page ? " is-active" : ""}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
