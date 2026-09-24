import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function fmt(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

// Feedback court capté avant le portail Stripe (voir /premium/annuler) --
// jamais garanti d'être exhaustif (un utilisateur peut toujours "Passer"),
// donc lu comme un signal directionnel, jamais comme un taux de churn
// complet ou une causalité (RETENTION_AUDIT.md, section 19 : ne jamais
// présenter une corrélation comme une causalité).
export default async function AdminCancellationsPage() {
  const admin = createAdminClient();

  const { data: cancellations } = await admin
    .from("subscription_cancellations")
    .select("id, reason, detail, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = cancellations ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const countsByReason = new Map<string, number>();
  for (const row of rows) {
    countsByReason.set(row.reason, (countsByReason.get(row.reason) ?? 0) + 1);
  }
  const sortedReasons = [...countsByReason.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <Link href="/admin/premium" style={{ fontSize: 12.5 }}>
        ← Premium payant
      </Link>
      <h1 style={{ fontSize: 26, margin: "10px 0 6px" }}>Annulations</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        {rows.length} retour(s) collecté(s) avant redirection vers le portail Stripe. Réponse
        optionnelle : ne couvre pas 100% des annulations réelles.
      </p>

      {sortedReasons.length > 0 && (
        <div className="card elev-sm" style={{ padding: "var(--space-5)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Raisons les plus citées</p>
          <div className="flex flex-col gap-2">
            {sortedReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                <span>{reason}</span>
                <span className="tag tag-neutral">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {rows.length === 0 ? (
          <p style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun retour pour l&apos;instant.
          </p>
        ) : (
          rows.map((row) => {
            const profile = profileById.get(row.user_id);
            return (
              <div key={row.id} className="card" style={{ padding: "var(--space-4)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.reason}</span>
                  <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                    {fmt(row.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: 12, margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                  {profile?.full_name || profile?.email || row.user_id}
                </p>
                {row.detail && (
                  <p style={{ fontSize: 13, margin: "8px 0 0", fontStyle: "italic" }}>&ldquo;{row.detail}&rdquo;</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
