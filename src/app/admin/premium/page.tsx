import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { fixMissingLtvAction } from "@/app/admin/users/actions";

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
};

function fmt(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
}

// "Temps d'utilisation" : on n'a pas de tracking de durée de session, donc on
// reconstruit le signal le plus honnête possible à partir de ce qu'on a déjà
// (ancienneté du compte, dernière activité via last_active_at, nombre de
// connexions via user_events) plutôt que d'inventer une métrique.
export default async function AdminPremiumPage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, subscription_status, premium_activated_at, total_paid_cents, created_at, last_active_at",
    )
    .in("subscription_status", ["active", "trialing"])
    .order("premium_activated_at", { ascending: false, nullsFirst: false });

  const rows = profiles ?? [];

  const sessionCounts = await Promise.all(
    rows.map((p) =>
      admin
        .from("user_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.id)
        .eq("event_type", "login"),
    ),
  );

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Premium payant</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        {rows.length} abonné(s) payant(s) (statut actif ou essai, hors codes offerts).
      </p>

      <div className="flex flex-col gap-2.5">
        {rows.map((p, i) => {
          const memberDays = daysSince(p.created_at);
          const premiumDays = daysSince(p.premium_activated_at);
          const sessions = sessionCounts[i].count ?? 0;
          const ltvMissing = (p.total_paid_cents ?? 0) === 0;
          return (
            <div key={p.id} className="card" style={{ padding: "var(--space-4)" }}>
              <Link href={`/admin/users/${p.id}`} className="no-underline" style={{ color: "inherit" }}>
                <div className="flex items-center justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{p.full_name || p.email}</p>
                    <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                      {p.email}
                    </p>
                  </div>
                  <span className="tag tag-accent" style={{ flexShrink: 0 }}>
                    {STATUS_LABEL[p.subscription_status ?? ""] ?? p.subscription_status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Payant depuis
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {p.premium_activated_at ? fmt(p.premium_activated_at) : "—"}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Membre depuis
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {memberDays === null ? "—" : `${memberDays} j (payant : ${premiumDays ?? "—"} j)`}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Dernière activité
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {fmt(p.last_active_at)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Sessions · LTV
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0", color: ltvMissing ? "var(--color-accent-700)" : "inherit" }}>
                      {sessions} · {((p.total_paid_cents ?? 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                </div>
              </Link>

              {ltvMissing && (
                <form action={fixMissingLtvAction} className="mt-3">
                  <input type="hidden" name="userId" value={p.id} />
                  <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    LTV à 0€ malgré paiement → Corriger (7,99€)
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun abonné payant pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
