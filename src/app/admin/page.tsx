import Link from "next/link";
import { submitIndexNowAction } from "@/app/admin/seo-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { POSTGREST_MAX_ROWS, fetchAllRows } from "@/lib/supabase/public";
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
  lifetime: "À vie",
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

// Visites depuis `since`, lues par curseur sur created_at (index
// site_visits_created_at_idx) : chaque page de 1000 lignes est une simple
// lecture d'index. La première version (08/10 midi) paginait par décalage
// avec un tri created_at + id, que la base refaisait sur toute la période à
// chaque page : /admin a atteint la limite de 300 s. Deux visites à la même
// microseconde à la jonction de deux pages : l'une peut être sautée,
// négligeable pour des comptes de visiteurs. Forme { data, error } comme les
// autres requêtes du tableau de bord.
async function readVisitsSince<T extends { created_at: string }>(
  admin: ReturnType<typeof createAdminClient>,
  columns: string,
  since: Date,
  maxRows: number,
): Promise<{ data: T[] | null; error: Error | null }> {
  const rows: T[] = [];
  let after: string | null = null;
  while (rows.length < maxRows) {
    let query = admin.from("site_visits").select(columns);
    query = after ? query.gt("created_at", after) : query.gte("created_at", since.toISOString());
    const { data, error } = await query.order("created_at").limit(POSTGREST_MAX_ROWS);
    if (error) return { data: null, error: new Error(error.message) };
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < POSTGREST_MAX_ROWS) break;
    after = page[page.length - 1].created_at;
  }
  return { data: rows, error: null };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; indexnow?: string; count?: string; message?: string }>;
}) {
  const { periode, indexnow, count: indexNowCount, message: indexNowMessage } = await searchParams;
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

  // "tout" doit quand même borner les requêtes site_visits et profiles (une
  // ligne par visite/inscription depuis le lancement) -- 180 jours est
  // largement au-delà de l'historique actuel du site, donc équivalent à
  // "tout" en pratique, sans risquer de ramener une table qui grossit
  // indéfiniment (déjà vu : "profiles" a dépassé le Max Rows de 1000 et
  // tronqué silencieusement le calcul de LTV avant le fix RPC ci-dessous).
  const periodFallback = new Date();
  periodFallback.setDate(periodFallback.getDate() - 180);
  const visitsSince = periodStart(period) ?? periodFallback;

  // ARR = somme des abonnements actifs/essai annualisés selon leur vraie
  // cadence Stripe (subscription_price_cents/interval, posés par le webhook
  // -- voir syncSubscription.ts). "comp" (codes offerts) exclu : aucun
  // revenu réel derrière. "lifetime" (paiement unique, voir premium/
  // actions.ts) exclu aussi, pour la raison inverse : revenu bien réel, mais
  // par définition non récurrent -- déjà compté une fois dans Revenu cumulé
  // (total_paid_cents), l'inclure ici en l'annualisant surestimerait l'ARR
  // chaque année suivante pour un paiement qui n'a eu lieu qu'une fois.
  const ANNUALIZATION_BY_INTERVAL: Record<string, number> = { day: 365, week: 52, month: 12, year: 1 };
  const DEFAULT_MONTHLY_PRICE_CENTS = 799;

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
    { data: totalRevenueCentsRpc, error: revenueError },
    { data: periodSignups, error: periodSignupsError },
    { data: recentProfiles, error: recentProfilesError },
    { data: pricingRows, error: pricingError },
    { count: activeOffers },
    { count: swipesTotal },
    { count: applicationsTotal },
    { data: visits, error: visitsError },
    { data: funnelStats, error: funnelStatsError },
    { data: reviewRows, error: reviewsError },
    { data: visitsToday, error: visitsTodayError },
    { data: signupsTodayRows, error: signupsTodayRowsError },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", onlineSince.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).in("subscription_status", ["active", "trialing", "lifetime"]),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "comp"),
    // Agrégation côté base (voir migration 20260914000000) plutôt qu'un
    // SELECT total_paid_cents sur toute la table : "profiles" a fini par
    // dépasser le "Max Rows" par défaut de l'API Supabase (1000), ce qui
    // tronquait silencieusement la somme calculée côté JS -- un RPC ne
    // retourne qu'un scalaire, jamais soumis à cette limite.
    admin.rpc("sum_total_paid_cents"),
    // Toujours bornée dans le temps, "tout" compris (via periodFallback,
    // 180 jours) : "profiles" grossit indéfiniment, un select sans borne
    // ici retomberait dans le même piège que la tuile revenu (Max Rows
    // 1000, tronqué en silence) -- reproductible aujourd'hui via
    // /admin?periode=tout avant ce fix.
    admin.from("profiles").select("created_at, subscription_status").gte("created_at", visitsSince.toISOString()),
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
    // Paginé : une requête simple s'arrête aux 1000 lignes du Max Rows, et
    // site_visits les dépasse (les préchargements de liens y étaient même
    // comptés jusqu'au 08/10) -- les visiteurs de la période étaient
    // calculés sur un échantillon tronqué.
    readVisitsSince<{ visitor_id: string; created_at: string }>(admin, "visitor_id, created_at", visitsSince, 60_000),
    // Agrégation côté base (voir migration 20260915000001) plutôt qu'un
    // SELECT brut sur user_events : avec 7 étapes x 2 événements, cette
    // requête dépasse le Max Rows (1000) dès quelques centaines
    // d'utilisateurs ayant traversé l'onboarding -- même piège que la LTV
    // avant sum_total_paid_cents, ici probablement déjà actif vu le volume
    // d'utilisateurs actuel.
    admin.rpc("onboarding_funnel_stats"),
    // Reviews : borné par prudence (une table qui devient un jour très
    // grande ne doit jamais tronquer silencieusement avgRating) même si le
    // volume actuel est très en dessous de 1000.
    admin.from("reviews").select("*").order("created_at", { ascending: false }).limit(5000),
    // Attribution pub (voir migration 20260927000000_utm_tracking.sql) :
    // bornée à aujourd'hui, mais paginée quand même (même piège Max Rows).
    readVisitsSince<{ visitor_id: string; utm_source: string | null; created_at: string }>(
      admin,
      "visitor_id, utm_source, created_at",
      todayStart,
      20_000,
    ),
    admin.from("profiles").select("utm_source").gte("created_at", todayStart.toISOString()),
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
  if (visitsError) console.error("AdminDashboardPage: visits query failed", visitsError);
  if (funnelStatsError) console.error("AdminDashboardPage: onboarding funnel query failed", funnelStatsError);
  if (reviewsError) console.error("AdminDashboardPage: reviews query failed", reviewsError);
  if (visitsTodayError) console.error("AdminDashboardPage: visits today query failed", visitsTodayError);
  if (signupsTodayRowsError) console.error("AdminDashboardPage: signups today query failed", signupsTodayRowsError);

  const paidPremium = paidPremiumCount ?? 0;
  const compPremium = compPremiumCount ?? 0;
  const premiumTotal = paidPremium + compPremium;
  const freePct = totalUsers && totalUsers > 0 ? Math.round(((totalUsers - premiumTotal) / totalUsers) * 100) : 0;
  const totalRevenueCents = totalRevenueCentsRpc ?? 0;

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
        p.subscription_status === "comp" ||
        p.subscription_status === "lifetime",
    })),
    period,
  );

  const weekdayAverages = computeWeekdayAverages(visits ?? []);

  // Répartition par source aujourd'hui : seul moyen de répondre à "j'ai eu
  // 106 clics TikTok mais 6 inscrits" avec des vraies données plutôt qu'une
  // supposition -- visiteurs distincts (une même personne qui recharge la
  // page ne doit pas compter deux fois) vs inscriptions, groupés par
  // utm_source (voir migration 20260927000000_utm_tracking.sql).
  const UNKNOWN_SOURCE = "direct / inconnu";
  const visitorsBySource = new Map<string, Set<string>>();
  for (const v of visitsToday ?? []) {
    const source = v.utm_source || UNKNOWN_SOURCE;
    if (!visitorsBySource.has(source)) visitorsBySource.set(source, new Set());
    visitorsBySource.get(source)!.add(v.visitor_id);
  }
  const signupsBySource = new Map<string, number>();
  for (const p of signupsTodayRows ?? []) {
    const source = p.utm_source || UNKNOWN_SOURCE;
    signupsBySource.set(source, (signupsBySource.get(source) ?? 0) + 1);
  }
  const acquisitionSources = [...new Set([...visitorsBySource.keys(), ...signupsBySource.keys()])].sort(
    (a, b) => (visitorsBySource.get(b)?.size ?? 0) - (visitorsBySource.get(a)?.size ?? 0),
  );

  // Revenu par source : la question n'est pas "combien de visites" mais
  // "combien rapporte chaque canal" (audit SEO du 07/10, section KPI). Cohorte
  // = inscrits des 30 derniers jours, revenu = ce qu'ils ont payé depuis
  // (total_paid_cents). Paginé : "profiles" dépasse le Max Rows (1000).
  const cohortSince = new Date();
  cohortSince.setDate(cohortSince.getDate() - 30);
  let cohort: { utm_source: string | null; total_paid_cents: number }[] = [];
  try {
    cohort = await fetchAllRows((from, to) =>
      admin
        .from("profiles")
        .select("utm_source, total_paid_cents")
        .gte("created_at", cohortSince.toISOString())
        .order("created_at")
        .range(from, to),
    );
  } catch (err) {
    console.error("AdminDashboardPage: revenue by source query failed", err);
  }
  const revenueBySource = new Map<string, { signups: number; payers: number; cents: number }>();
  for (const p of cohort) {
    const source = p.utm_source || UNKNOWN_SOURCE;
    const entry = revenueBySource.get(source) ?? { signups: 0, payers: 0, cents: 0 };
    entry.signups += 1;
    if ((p.total_paid_cents ?? 0) > 0) entry.payers += 1;
    entry.cents += p.total_paid_cents ?? 0;
    revenueBySource.set(source, entry);
  }
  const revenueSources = [...revenueBySource.entries()].sort((a, b) => b[1].cents - a[1].cents || b[1].signups - a[1].signups);
  const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  const stepStats = new Map<StepId, { viewed: number; completed: number }>();
  for (const id of STEP_IDS) stepStats.set(id, { viewed: 0, completed: 0 });
  for (const row of funnelStats ?? []) {
    const step = row.step as StepId | null;
    if (!step || !stepStats.has(step)) continue;
    stepStats.set(step, { viewed: row.viewed_count, completed: row.completed_count });
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

      {indexnow && (
        <p className="card" style={{ padding: "var(--space-3)", marginBottom: 12, fontSize: 13 }}>
          {indexnow === "ok"
            ? `IndexNow : ${indexNowCount} URLs envoyées à Bing (indexation en quelques heures à quelques jours).`
            : `IndexNow a échoué : ${indexNowMessage ?? "erreur inconnue"}.`}
        </p>
      )}
      <form action={submitIndexNowAction} style={{ marginBottom: 16 }}>
        <button type="submit" className="btn btn-secondary">
          Envoyer le site à Bing (IndexNow)
        </button>
      </form>

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
        title="Acquisition — aujourd'hui"
        subtitle="Visiteurs distincts et inscriptions du jour, par source. Liens ?utm_source=... (pubs, partages) + détection automatique du site d'origine : google / bing = référencement, chatgpt, perplexity, gemini, meta-ai, grok, deepseek, mistral = IA ; tiktok / instagram = réseaux. Inscriptions Google incluses depuis le 08/10. « direct / inconnu » = lien tapé ou appli sans référent."
      >
        {acquisitionSources.length === 0 ? (
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
            Aucune visite aujourd&apos;hui.
          </p>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Source</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Visiteurs</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Inscriptions</th>
              </tr>
            </thead>
            <tbody>
              {acquisitionSources.map((source) => (
                <tr key={source} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "6px 0", fontWeight: source === UNKNOWN_SOURCE ? 400 : 700 }}>{source}</td>
                  <td style={{ padding: "6px 0" }}>{visitorsBySource.get(source)?.size ?? 0}</td>
                  <td style={{ padding: "6px 0" }}>{signupsBySource.get(source) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard
        title="Revenu par source — inscrits des 30 derniers jours"
        subtitle="Combien rapporte chaque canal : inscrits sur 30 jours, combien ont payé, revenu encaissé depuis. Même détection de source que ci-dessus (google = référencement, partage = boutons de partage...)."
      >
        {revenueSources.length === 0 ? (
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
            Aucun inscrit sur les 30 derniers jours.
          </p>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Source</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Inscrits</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Payants</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Revenu</th>
                <th style={{ padding: "4px 0", fontWeight: 500 }}>Revenu / inscrit</th>
              </tr>
            </thead>
            <tbody>
              {revenueSources.map(([source, r]) => (
                <tr key={source} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "6px 0", fontWeight: source === UNKNOWN_SOURCE ? 400 : 700 }}>{source}</td>
                  <td style={{ padding: "6px 0" }}>{r.signups}</td>
                  <td style={{ padding: "6px 0" }}>
                    {r.payers} ({Math.round((r.payers / r.signups) * 100)} %)
                  </td>
                  <td style={{ padding: "6px 0" }}>{euros(r.cents)}</td>
                  <td style={{ padding: "6px 0" }}>{euros(Math.round(r.cents / r.signups))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                const viewed = stats.viewed;
                const completed = stats.completed;
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
