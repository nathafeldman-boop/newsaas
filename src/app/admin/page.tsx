import { createAdminClient } from "@/lib/supabase/admin";

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card elev-sm" style={{ padding: "var(--space-5)" }}>
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 32,
          margin: 0,
          color: accent ? "var(--color-accent)" : "inherit",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          margin: "6px 0 0",
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  // Fenêtre "en ligne" : (app)/layout.tsx retape last_active_at à chaque
  // navigation, donc quelques minutes suffisent à couvrir quelqu'un qui
  // vient de charger une page et lit tranquillement sans re-naviguer tout
  // de suite.
  const onlineSince = new Date();
  onlineSince.setMinutes(onlineSince.getMinutes() - 5);

  const [
    { count: totalUsers },
    { count: signupsToday },
    { count: signupsWeek },
    { count: onlineNow },
    { data: subs },
    { count: activeOffers },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_active_at", onlineSince.toISOString()),
    admin.from("profiles").select("subscription_status, total_paid_cents"),
    admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const paidPremium = (subs ?? []).filter(
    (p) => p.subscription_status === "active" || p.subscription_status === "trialing",
  ).length;
  const compPremium = (subs ?? []).filter((p) => p.subscription_status === "comp").length;
  const totalRevenueCents = (subs ?? []).reduce((sum, p) => sum + (p.total_paid_cents ?? 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 20px" }}>Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="En ligne maintenant" value={String(onlineNow ?? 0)} accent />
        <StatTile label="Inscrits aujourd'hui" value={String(signupsToday ?? 0)} accent />
        <StatTile label="Inscrits (7 jours)" value={String(signupsWeek ?? 0)} />
        <StatTile label="Total utilisateurs" value={String(totalUsers ?? 0)} />
        <StatTile label="Premium payant" value={String(paidPremium)} accent />
        <StatTile label="Premium offert (codes)" value={String(compPremium)} />
        <StatTile
          label="Revenu cumulé"
          value={`${(totalRevenueCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`}
        />
        <StatTile label="Offres actives" value={String(activeOffers ?? 0)} />
      </div>
    </div>
  );
}
