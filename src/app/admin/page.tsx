import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfTodayParis } from "@/lib/date";
import { STEP_IDS, STEP_LABELS, type StepId } from "@/lib/onboarding/steps";
import { LineAreaChart } from "@/components/admin/charts/LineAreaChart";
import { WeekdayBarChart } from "@/components/admin/charts/WeekdayBarChart";
import { bucketizeSignups, computeWeekdayAverages, periodStart, type Period } from "@/lib/admin/analytics";
import { moderateReviewAction } from "./reviews-actions";

const PERIODS: Period[] = ["7j", "30j", "90j", "tout"];
const PERIOD_LABELS: Record<Period, string> = {
  "7j": "7 jours",
  "30j": "30 jours",
  "90j": "90 jours",
  tout: "Tout",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Payant",
  trialing: "Essai",
  comp: "Offert",
};

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

function StatTile({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: string;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <>
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
        {href && " →"}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card elev-sm no-underline"
        style={{ padding: "var(--space-5)", color: "inherit", display: "block" }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="card elev-sm" style={{ padding: "var(--space-5)" }}>
      {content}
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card elev-sm mt-6" style={{ padding: "var(--space-5)" }}>
      <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ fontSize: 12, margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
          {subtitle}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const period: Period = (PERIODS as string[]).includes(periode ?? "") ? (periode as Period) : "30j";

  const admin = createAdminClient();

  // Minuit heure de Paris, pas heure du serveur (UTC sur Vercel) : sinon
  // "Inscrits aujourd'hui" bascule vers le jour suivant avec 1-2h d'avance
  // par rapport à l'heure française.
  const todayStart = startOfTodayParis();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  // Fenêtre "en ligne" : (app)/layout.tsx retape last_active_at à chaque
  // navigation, donc quelques minutes suffisent à couvrir quelqu'un qui
  // vient de charger une page et lit tranquillement sans re-naviguer tout
  // de suite.
  const onlineSince = new Date();
  onlineSince.setMinutes(onlineSince.getMinutes() - 5);

  // "tout" doit quand même borner la requête site_visits (une ligne par
  // navigation depuis le lancement) -- 180 jours est largement au-delà de
  // l'historique actuel du site, donc équivalent à "tout" en pratique, sans
  // risquer de ramener une table qui grossit indéfiniment.
  const visitsFallback = new Date();
  visitsFallback.setDate(visitsFallback.getDate() - 180);
  const visitsSince = periodStart(period) ?? visitsFallback;

  // ARR = somme des abonnements actifs/essai annualisés selon leur vraie
  // cadence Stripe (subscription_price_cents/interval, posés par le webhook
  // -- voir syncSubscription.ts). "comp" (codes offerts) exclu : aucun
  // revenu réel derrière.
  const ANNUALIZATION_BY_INTERVAL: Record<string, number> = { day: 365, week: 52, month: 12, year: 1 };
  const DEFAULT_MONTHLY_PRICE_CENTS = 799;

  const periodCutoff = periodStart(period);

  // Chaque stat vient désormais d'une requête ciblée (count exact côté
  // Postgres, ou colonnes minimales + filtre de date) plutôt que d'un seul
  // SELECT * sans limite sur toute la table profiles -- cette dernière
  // grossit indéfiniment et a fini par déclencher des Gateway Timeout sur
  // /admin en prod (vu le 11-12/09). Aucune des requêtes ci-dessous ne
  // ramène plus de lignes que nécessaire pour la stat qu'elle sert.
  const [
    { count: totalUsers },
    { count: signupsToday },
    { count: signupsWeek },
    { count: onlineNow },
    { count: paidPremiumCount },
    { count: compPremiumCount },
    { data: revenueRows, error: revenueError },
    { data: periodSignups, error: periodSignupsError },
    { data: recentProfiles, error: recentProfilesError },
    { data: pricingRows, error: pricingError },
    { count: activeOffers },
    { count: swipesTotal },
    { count: applicationsTotal },
    { data: visits },
    { data: onboardingEvents },
    { data: reviewRows },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", onlineSince.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).in("subscription_status", ["active", "trialing"]),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "comp"),
    // Une seule colonne, sans tri : suffisant pour la somme du revenu
    // cumulé, bien plus léger qu'un SELECT multi-colonnes trié.
    admin.from("profiles").select("total_paid_cents"),
    // Bornée à la période choisie (sauf "tout") : le graphe n'a jamais
    // besoin de l'historique complet pour "7 jours" ou "30 jours".
    periodCutoff
      ? admin.from("profiles").select("created_at, subscription_status").gte("created_at", periodCutoff.toISOString())
      : admin.from("profiles").select("created_at, subscription_status"),
    // Table "derniers inscrits" : seulement les 25 affichés, jamais toute
    // la base.
    admin
      .from("profiles")
      .select("id, email, full_name, created_at, subscription_status, total_paid_cents")
      .order("created_at", { ascending: false })
      .limit(25),
    // Colonnes ARR récentes : si jamais elles manquent encore en base
    // (migration pas collée) ou que la requête échoue, ça ne doit affecter
    // QUE l'ARR -- jamais Premium/Revenu cumulé/Gratuit, calculés à part.
    admin
      .from("profiles")
      .select("subscription_price_cents, subscription_interval")
      .in("subscription_status", ["active", "trialing"]),
    admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("swipes").select("id", { count: "exact", head: true }),
    admin.from("applications").select("id", { count: "exact", head: true }),
    admin.from("site_visits").select("visitor_id, created_at").gte("created_at", visitsSince.toISOString()),
    admin
      .from("user_events")
      .select("user_id, event_type, metadata")
      .in("event_type", ["onboarding_step_viewed", "onboarding_step_completed"]),
    admin.from("reviews").select("*").order("created_at", { ascending: false }),
  ]);

  // supabase-js ne throw jamais sur une erreur Postgres (ex: colonne pas
  // encore migrée en base) -- sans ces logs, une requête qui échoue ici
  // retombe silencieusement sur `[]`/0, et les stats concernées affichent
  // tout sans aucune trace pour comprendre pourquoi (déjà vu avec
  // site_visits et la synchro Stripe -- même mésaventure, cause différente).
  if (revenueError) console.error("AdminDashboardPage: revenue query failed", revenueError);
  if (periodSignupsError) console.error("AdminDashboardPage: period signups query failed", periodSignupsError);
  if (recentProfilesError) console.error("AdminDashboardPage: recent profiles query failed", recentProfilesError);
  if (pricingError) console.error("AdminDashboardPage: ARR pricing query failed", pricingError);

  const paidPremium = paidPremiumCount ?? 0;
  const compPremium = compPremiumCount ?? 0;
  const premiumTotal = paidPremium + compPremium;
  const freePct = totalUsers && totalUsers > 0 ? Math.round(((totalUsers - premiumTotal) / totalUsers) * 100) : 0;
  const totalRevenueCents = (revenueRows ?? []).reduce((sum, p) => sum + (p.total_paid_cents ?? 0), 0);

  // Un abonné actif depuis avant l'ajout de ces deux colonnes (ou si la
  // requête ci-dessus a échoué) n'a encore ni l'un ni l'autre -- fallback
  // sur le prix mensuel (799 = 7,99€), seule offre qui existait jusqu'ici,
  // plutôt que de sous-compter silencieusement ces comptes.
  const arrCents = (pricingRows ?? []).reduce((sum, p) => {
    const priceCents = p.subscription_price_cents ?? DEFAULT_MONTHLY_PRICE_CENTS;
    const multiplier = ANNUALIZATION_BY_INTERVAL[p.subscription_interval ?? "month"] ?? 12;
    return sum + priceCents * multiplier;
  }, 0);

  const periodProfiles = periodSignups ?? [];
  const chartData = bucketizeSignups(
    periodProfiles.map((p) => ({
      created_at: p.created_at,
      isPremium:
        p.subscription_status === "active" ||
        p.subscription_status === "trialing" ||
        p.subscription_status === "comp",
    })),
    period,
  );

  const weekdayAverages = computeWeekdayAverages(visits ?? []);

  const stepStats = new Map<StepId, { viewed: Set<string>; completed: Set<string> }>();
  for (const id of STEP_IDS) stepStats.set(id, { viewed: new Set(), completed: new Set() });
  for (const ev of onboardingEvents ?? []) {
    const step = (ev.metadata as Record<string, unknown> | null)?.step as StepId | undefined;
    if (!step || !stepStats.has(step)) continue;
    const entry = stepStats.get(step)!;
    if (ev.event_type === "onboarding_step_viewed") entry.viewed.add(ev.user_id);
    else entry.completed.add(ev.user_id);
  }

  const allReviews = reviewRows ?? [];
  const avgRating =
    allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
  const goodReviews = allReviews.filter((r) => r.rating >= 4).length;
  const pendingReviews = allReviews.filter((r) => r.status === "pending");

  // Auteurs des avis en attente uniquement (quelques lignes au plus),
  // plutôt qu'un lookup dans toute la table profiles.
  const pendingReviewUserIds = [...new Set(pendingReviews.map((r) => r.user_id))];
  const profileById = new Map<string, { full_name: string | null; email: string | null }>();
  if (pendingReviewUserIds.length > 0) {
    const { data: reviewAuthors, error: reviewAuthorsError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", pendingReviewUserIds);
    if (reviewAuthorsError) {
      console.error("AdminDashboardPage: review authors query failed", reviewAuthorsError);
    } else {
      for (const p of reviewAuthors ?? []) profileById.set(p.id, p);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 20px" }}>Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="En ligne maintenant" value={String(onlineNow ?? 0)} accent href="/admin/online" />
        <StatTile label="Inscrits aujourd'hui" value={String(signupsToday ?? 0)} accent />
        <StatTile label="Inscrits (7 jours)" value={String(signupsWeek ?? 0)} />
        <StatTile label="Total utilisateurs" value={String(totalUsers ?? 0)} />
        <StatTile label="Premium (avec bonus)" value={`${premiumTotal} (${totalUsers && totalUsers > 0 ? Math.round((premiumTotal / totalUsers) * 100) : 0}%)`} accent />
        <StatTile label="Dont payant réel" value={String(paidPremium)} accent href="/admin/premium" />
        <StatTile label="Gratuit" value={`${freePct}%`} />
        <StatTile
          label="Revenu cumulé"
          value={`${(totalRevenueCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`}
        />
        <StatTile
          label="ARR"
          value={`${(arrCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €`}
          accent
        />
        <StatTile label="Offres actives" value={String(activeOffers ?? 0)} />
      </div>
      <p style={{ fontSize: 11, marginTop: 10, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
        « Dont payant réel » = abonnement Stripe actif ou en essai uniquement — exclut les codes d&apos;accès offerts.
        « ARR » = abonnements actifs/essai annualisés selon leur vraie cadence (mensuel/hebdo), hors codes offerts.
      </p>

      <SectionCard title="Inscriptions">
        <div className="seg mb-4" style={{ display: "inline-flex" }}>
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?periode=${p}`}
              className={`seg-opt${p === period ? " is-active" : ""}`}
              style={{ padding: "8px 14px" }}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
        <LineAreaChart data={chartData} total={periodProfiles.length} />
      </SectionCard>

      <SectionCard
        title="Jours avec le plus de monde"
        subtitle="Visiteurs distincts par jour de semaine, sur la période sélectionnée."
      >
        <WeekdayBarChart averages={weekdayAverages} />
      </SectionCard>

      <SectionCard
        title="Funnel onboarding"
        subtitle="Vus / terminés par étape, tous comptes connectés confondus."
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "6px 8px 6px 0", fontWeight: 500 }}>Écran</th>
                <th style={{ padding: "6px 8px", fontWeight: 500 }}>Vus</th>
                <th style={{ padding: "6px 8px", fontWeight: 500 }}>Terminés</th>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>Abandon</th>
              </tr>
            </thead>
            <tbody>
              {STEP_IDS.map((id, i) => {
                const stats = stepStats.get(id)!;
                const viewed = stats.viewed.size;
                const completed = stats.completed.size;
                const dropoff = viewed > 0 ? Math.round(((viewed - completed) / viewed) * 100) : 0;
                return (
                  <tr key={id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "8px 8px 8px 0" }}>
                      {i + 1}. {STEP_LABELS[id]}
                    </td>
                    <td style={{ padding: "8px" }}>{viewed}</td>
                    <td style={{ padding: "8px" }}>{completed}</td>
                    <td style={{ padding: "8px 0" }}>{viewed > 0 ? `${dropoff}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title={`Avis (${allReviews.length})`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2" style={{ marginBottom: 18 }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Note moyenne
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{goodReviews}</p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Bons avis (≥4/5)
            </p>
          </div>
        </div>

        <h3 style={{ fontSize: 13, margin: "0 0 10px", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          En attente de modération ({pendingReviews.length})
        </h3>
        {pendingReviews.length === 0 ? (
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun avis en attente.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendingReviews.map((r) => {
              const author = profileById.get(r.user_id);
              return (
                <div key={r.id} className="card" style={{ padding: "var(--space-3) var(--space-4)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}{" "}
                        <span style={{ fontWeight: 400, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                          {author?.full_name || author?.email || "—"}
                        </span>
                      </p>
                      {r.comment && (
                        <p style={{ margin: "4px 0 0", fontSize: 13 }}>{r.comment}</p>
                      )}
                    </div>
                    <div className="flex gap-2" style={{ flexShrink: 0 }}>
                      <form action={moderateReviewAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                          Approuver
                        </button>
                      </form>
                      <form action={moderateReviewAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                          Rejeter
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Usage des fonctionnalités">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{swipesTotal ?? 0}</p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Swipes
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{applicationsTotal ?? 0}</p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Candidatures
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{allReviews.length}</p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Avis
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{activeOffers ?? 0}</p>
            <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Offres actives
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={`Visiteurs (${Math.min(25, totalUsers ?? 0)} derniers inscrits)`}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "6px 8px 6px 0", fontWeight: 500 }}>Email</th>
                <th style={{ padding: "6px 8px", fontWeight: 500 }}>Inscrit le</th>
                <th style={{ padding: "6px 8px", fontWeight: 500 }}>Statut</th>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>LTV</th>
              </tr>
            </thead>
            <tbody>
              {(recentProfiles ?? []).map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    <Link href={`/admin/users/${p.id}`}>{p.email}</Link>
                  </td>
                  <td style={{ padding: "8px" }}>{fmtDate(p.created_at)}</td>
                  <td style={{ padding: "8px" }}>{STATUS_LABEL[p.subscription_status ?? ""] ?? "Gratuit"}</td>
                  <td style={{ padding: "8px 0" }}>
                    {((p.total_paid_cents ?? 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/admin/users" className="btn btn-secondary mt-4" style={{ display: "inline-block" }}>
          Voir tous les utilisateurs →
        </Link>
      </SectionCard>
    </div>
  );
}
