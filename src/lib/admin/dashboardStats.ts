import { unstable_cache } from "next/cache";
import { computeWeekdayAverages, periodStart, type Period } from "@/lib/admin/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows, POSTGREST_MAX_ROWS } from "@/lib/supabase/public";
import { NEWS_CAMPAIGN_EVENT, NEWS_UTM_CAMPAIGN, NEWS_VARIANTS, newsUtmCampaign } from "@/lib/campaigns/relanceOffres";

// Statistiques lourdes du tableau de bord : bornées, en cache, et jamais
// bloquantes.
//
// Historique (08/10) : jusqu'à 12 h 10 UTC, le proxy écrivait une ligne
// site_visits pour chaque préchargement de lien (une cinquantaine par page
// vue). La table contient donc des millions de lignes avant cette heure-là.
// Lire « toutes les visites de la période » pour le graphique par jour de
// semaine a fait tomber /admin en délai dépassé (300 s) à 13 h puis à 18 h 21.
// Désormais :
// - on ne lit que les visites propres, depuis VISITS_CLEAN_SINCE ;
// - au plus MAX_ROWS lignes, en fenêtres (jour, ou heure pour aujourd'hui)
//   lues 6 à la fois ;
// - résultat en cache (1 h graphique, 5 min sources du jour) ;
// - et la page n'attend jamais plus de quelques secondes (withTimeout).
// Le vrai correctif est une fonction SQL d'agrégation (proposée dans
// SEO_ROADMAP.md, migration à valider par Nathan).

export const VISITS_CLEAN_SINCE = new Date("2026-10-08T12:15:00Z");

const CONCURRENCY = 6;
const MAX_ROWS = 100_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type Admin = ReturnType<typeof createAdminClient>;

// Visites de [from, to), par curseur sur created_at (index
// site_visits_created_at_idx). Deux visites à la même microseconde à la
// jonction de deux pages : l'une peut être sautée, négligeable ici.
async function readWindow<T extends { created_at: string }>(
  admin: Admin,
  columns: string,
  from: Date,
  to: Date,
  budget: { rows: number },
): Promise<T[]> {
  const rows: T[] = [];
  let after: string | null = null;
  while (budget.rows < MAX_ROWS) {
    let query = admin.from("site_visits").select(columns).lt("created_at", to.toISOString());
    query = after ? query.gt("created_at", after) : query.gte("created_at", from.toISOString());
    const { data, error } = await query.order("created_at").limit(POSTGREST_MAX_ROWS);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    budget.rows += page.length;
    if (page.length < POSTGREST_MAX_ROWS) break;
    after = page[page.length - 1].created_at;
  }
  return rows;
}

export async function readVisits<T extends { created_at: string }>(columns: string, since: Date, until: Date, windowMs: number): Promise<T[]> {
  const admin = createAdminClient();
  const start = Math.max(since.getTime(), VISITS_CLEAN_SINCE.getTime());
  const windows: [Date, Date][] = [];
  for (let t = start; t < until.getTime(); t += windowMs) {
    windows.push([new Date(t), new Date(Math.min(t + windowMs, until.getTime()))]);
  }
  const budget = { rows: 0 };
  const results: T[][] = new Array(windows.length).fill([]);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, windows.length) }, async () => {
      while (next < windows.length && budget.rows < MAX_ROWS) {
        const i = next++;
        results[i] = await readWindow<T>(admin, columns, windows[i][0], windows[i][1], budget);
      }
    }),
  );
  return results.flat();
}

// "tout" est borné à 180 jours, comme le reste du tableau de bord.
const ALL_TIME_DAYS = 180;

// Un seul calcul à la fois par instance (et par arguments), et plus aucun
// nouvel essai pendant COOLDOWN_MS après un échec : une erreur n'étant pas
// mise en cache, chaque rechargement de /admin relançait sinon les mêmes
// lectures lourdes sur une base déjà lente, et l'enfonçait davantage
// (09/10, 10 h 30 UTC : 31 erreurs en 5 minutes, site entier ralenti).
// Pendant la pause, le cache sert la dernière valeur connue, ou le tableau
// de bord affiche « calcul en cours ».
const COOLDOWN_MS = 5 * 60 * 1000;

function guarded<A extends unknown[], R>(name: string, compute: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  let failedAt = 0;
  const inFlight = new Map<string, Promise<R>>();
  return (...args: A) => {
    if (Date.now() - failedAt < COOLDOWN_MS) return Promise.reject(new Error(`${name}: en pause après un échec récent`));
    const key = JSON.stringify(args);
    const pending = inFlight.get(key);
    if (pending) return pending;
    const promise = compute(...args)
      .catch((err) => {
        failedAt = Date.now();
        throw err;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}

export const getWeekdayAverages = unstable_cache(
  guarded("weekday averages", async (period: Period): Promise<number[]> => {
    const until = new Date();
    const since = periodStart(period) ?? new Date(until.getTime() - ALL_TIME_DAYS * DAY_MS);
    const visits = await readVisits<{ visitor_id: string; created_at: string }>("visitor_id, created_at", since, until, DAY_MS);
    return computeWeekdayAverages(visits);
  }),
  ["admin-weekday-averages-v2"],
  { revalidate: 3600 },
);

// Visiteurs distincts du jour par source (utm_source), du plus gros au plus petit.
export const getTodayVisitorsBySource = unstable_cache(
  guarded("today visitors by source", async (todayStartIso: string, unknownLabel: string): Promise<[string, number][]> => {
    const visits = await readVisits<{ visitor_id: string; utm_source: string | null; created_at: string }>(
      "visitor_id, utm_source, created_at",
      new Date(todayStartIso),
      new Date(),
      HOUR_MS,
    );
    const bySource = new Map<string, Set<string>>();
    for (const v of visits) {
      const source = v.utm_source || unknownLabel;
      if (!bySource.has(source)) bySource.set(source, new Set());
      bySource.get(source)!.add(v.visitor_id);
    }
    return [...bySource.entries()].map(([source, visitors]): [string, number] => [source, visitors.size]).sort((a, b) => b[1] - a[1]);
  }),
  ["admin-today-visitors-by-source-v2"],
  { revalidate: 300 },
);

// Entonnoir d'onboarding sur les 30 derniers jours (22/10 : sur tout
// l'historique, la fonction SQL dépassait le délai de la base même avec
// l'index user_events (event_type, created_at)). Utilise
// onboarding_funnel_stats_since (SQL donné à Nathan le 22/10) ; tant qu'elle
// n'existe pas, retombe sur l'ancienne fonction (tout l'historique) et le
// dit (since: null). En cache 30 min ; une erreur n'est jamais mise en cache
// (exception levée) : nouvel essai au plus tôt 5 min après (guarded).
export type OnboardingFunnelStats = {
  rows: { step: string | null; viewed_count: number; completed_count: number }[];
  since: string | null;
};

export const FUNNEL_WINDOW_DAYS = 30;

export const getOnboardingFunnelStats = unstable_cache(
  guarded("onboarding funnel", async (): Promise<OnboardingFunnelStats> => {
    const admin = createAdminClient();
    const since = new Date(Date.now() - FUNNEL_WINDOW_DAYS * DAY_MS).toISOString();
    const recent = await admin.rpc("onboarding_funnel_stats_since", { p_since: since });
    if (!recent.error) return { rows: recent.data ?? [], since };
    // PGRST202 : fonction absente de la base (SQL pas encore lancé).
    if (recent.error.code !== "PGRST202") throw new Error(recent.error.message);
    const { data, error } = await admin.rpc("onboarding_funnel_stats");
    if (error) throw new Error(error.message);
    return { rows: data ?? [], since: null };
  }),
  ["admin-onboarding-funnel-v2"],
  { revalidate: 1800 },
);

// Le tableau de bord n'attend jamais une statistique lourde plus de `ms` :
// au-delà, il s'affiche sans elle (timedOut) et le calcul continue tant que
// la fonction tourne, ce qui remplit le cache pour le chargement suivant.
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<{ value: T; timedOut: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ value: T; timedOut: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ value: fallback, timedOut: true }), ms);
  });
  try {
    return await Promise.race([promise.then((value) => ({ value, timedOut: false })), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

// Chemin de Léo (SOP 26, 17/10) : les taux de l'entonnoir sur les inscrits
// des 7 derniers jours, à comparer aux benchmarks de la fiche. Arrivées =
// visiteurs distincts de l'accueil (/). paywall_viewed et checkout_opened
// sont notés depuis le 17/10 (page /premium et création de la session
// Stripe). Payé = au moins un paiement réel (total_paid_cents > 0).
export type LeoFunnel = {
  arrivals: number;
  signupStarted: number;
  signups: number;
  onboarded: number;
  paywallViewed: number;
  checkoutOpened: number;
  paid: number;
};

export const getLeoFunnel = unstable_cache(
  guarded("leo funnel", async (): Promise<LeoFunnel> => {
    const since = new Date(Date.now() - 7 * DAY_MS);
    const admin = createAdminClient();
    const [visits, { data: signups, error }] = await Promise.all([
      readVisits<{ visitor_id: string; path: string; created_at: string }>("visitor_id, path, created_at", since, new Date(), DAY_MS),
      admin.from("profiles").select("id, onboarding_completed, total_paid_cents").gte("created_at", since.toISOString()).limit(10_000),
    ]);
    if (error) throw new Error(error.message);
    const ids = (signups ?? []).map((p) => p.id);
    const viewed = new Set<string>();
    const opened = new Set<string>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data: events, error: eventsError } = await admin
        .from("user_events")
        .select("user_id, event_type")
        .in("event_type", ["paywall_viewed", "checkout_opened"])
        .in("user_id", ids.slice(i, i + 200))
        .gte("created_at", since.toISOString())
        .limit(20_000);
      if (eventsError) throw new Error(eventsError.message);
      for (const e of events ?? []) (e.event_type === "paywall_viewed" ? viewed : opened).add(e.user_id);
    }
    return {
      arrivals: new Set(visits.filter((v) => v.path === "/").map((v) => v.visitor_id)).size,
      // Sign-up commencé (SOP 16) : visiteurs distincts du formulaire d'inscription.
      signupStarted: new Set(visits.filter((v) => v.path === "/inscription").map((v) => v.visitor_id)).size,
      signups: ids.length,
      onboarded: (signups ?? []).filter((p) => p.onboarding_completed).length,
      paywallViewed: viewed.size,
      checkoutOpened: opened.size,
      paid: (signups ?? []).filter((p) => p.total_paid_cents > 0).length,
    };
  }),
  ["admin-leo-funnel-v2"],
  { revalidate: 1800 },
);

// « Tu nous as connus comment ? » (onboarding, depuis le 20/10) : dernière
// réponse de chaque inscrit des 30 derniers jours, et ce qu'il a payé depuis.
// Lu par lots d'inscrits (index user_id + event_type) comme getLeoFunnel :
// un filtre sur event_type seul parcourrait toute la table.
export type HeardFromStats = {
  signups: number;
  answered: number;
  rows: { source: string; answers: number; payers: number; cents: number }[];
};

export const getHeardFromStats = unstable_cache(
  guarded("heard from", async (): Promise<HeardFromStats> => {
    const since = new Date(Date.now() - 30 * DAY_MS);
    const admin = createAdminClient();
    const signups = await fetchAllRows<{ id: string; total_paid_cents: number }>((from, to) =>
      admin.from("profiles").select("id, total_paid_cents").gte("created_at", since.toISOString()).order("created_at").range(from, to),
    );
    const paidById = new Map(signups.map((p) => [p.id, p.total_paid_cents ?? 0]));
    const ids = [...paidById.keys()];
    const latest = new Map<string, { source: string; at: string }>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await admin
        .from("user_events")
        .select("user_id, metadata, created_at")
        .eq("event_type", "heard_from")
        .in("user_id", ids.slice(i, i + 200))
        .limit(POSTGREST_MAX_ROWS);
      if (error) throw new Error(error.message);
      for (const e of data ?? []) {
        const source = (e.metadata as { source?: unknown } | null)?.source;
        if (typeof source !== "string") continue;
        const prev = latest.get(e.user_id);
        if (!prev || e.created_at > prev.at) latest.set(e.user_id, { source, at: e.created_at });
      }
    }
    const bySource = new Map<string, { source: string; answers: number; payers: number; cents: number }>();
    for (const [userId, { source }] of latest) {
      const row = bySource.get(source) ?? { source, answers: 0, payers: 0, cents: 0 };
      const cents = paidById.get(userId) ?? 0;
      row.answers += 1;
      if (cents > 0) row.payers += 1;
      row.cents += cents;
      bySource.set(source, row);
    }
    return {
      signups: ids.length,
      answered: latest.size,
      rows: [...bySource.values()].sort((a, b) => b.answers - a.answers || b.cents - a.cents),
    };
  }),
  ["admin-heard-from-v1"],
  { revalidate: 1800 },
);

// Relance email « nouveautés » (envoyée depuis le 23/10) : emails partis,
// personnes arrivées par un lien de l'email (visiteurs distincts, d'après
// utm_campaign), destinataires revenus sur Stageio après leur email (par
// n'importe quel chemin), et ceux qui ont payé après. « Aujourd'hui » =
// depuis minuit (heure de Paris).
export type NewsCampaignStats = {
  sent: number;
  sentToday: number;
  clickers: number;
  clickersToday: number;
  cameBack: number;
  payers: number;
  payersCents: number;
};

const NEWS_CAMPAIGN_START = "2026-10-22T22:00:00Z";

export const getNewsCampaignStats = unstable_cache(
  guarded("news campaign", async (todayStartIso: string): Promise<NewsCampaignStats> => {
    const admin = createAdminClient();
    const [events, visits] = await Promise.all([
      fetchAllRows<{ user_id: string; created_at: string }>((from, to) =>
        admin
          .from("user_events")
          .select("user_id, created_at")
          .eq("event_type", NEWS_CAMPAIGN_EVENT)
          .order("created_at")
          .range(from, to),
      ),
      fetchAllRows<{ visitor_id: string; created_at: string }>((from, to) =>
        admin
          .from("site_visits")
          .select("visitor_id, created_at")
          .gte("created_at", NEWS_CAMPAIGN_START)
          // 1re vague (23/10) et versions testées à partir du 26/10.
          .in("utm_campaign", [NEWS_UTM_CAMPAIGN, ...NEWS_VARIANTS.map(newsUtmCampaign)])
          .order("created_at")
          .range(from, to),
      ),
    ]);

    const sentAt = new Map(events.map((e) => [e.user_id, e.created_at]));
    const ids = [...sentAt.keys()];
    let cameBack = 0;
    let payers = 0;
    let payersCents = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await admin
        .from("profiles")
        .select("id, last_active_at, premium_activated_at, total_paid_cents")
        .in("id", ids.slice(i, i + 200));
      if (error) throw new Error(error.message);
      for (const p of data ?? []) {
        const at = sentAt.get(p.id);
        if (!at) continue;
        if (p.last_active_at && p.last_active_at > at) cameBack++;
        if (p.premium_activated_at && p.premium_activated_at > at && (p.total_paid_cents ?? 0) > 0) {
          payers++;
          payersCents += p.total_paid_cents ?? 0;
        }
      }
    }

    return {
      sent: events.length,
      sentToday: events.filter((e) => e.created_at >= todayStartIso).length,
      clickers: new Set(visits.map((v) => v.visitor_id)).size,
      clickersToday: new Set(visits.filter((v) => v.created_at >= todayStartIso).map((v) => v.visitor_id)).size,
      cameBack,
      payers,
      payersCents,
    };
  }),
  ["admin-news-campaign-v2"],
  { revalidate: 300 },
);

// RPM par source (SOP 16) : sur les 7 jours qui finissent `endIso` (même
// période que les vues saisies), par utm_source -- arrivées (visiteurs
// distincts), inscrits, et revenu du PREMIER paiement uniquement (jamais la
// LTV : « comme ça tu es sûr d'être en bénéfice sur la suite »), attribué à
// la source d'inscription du compte.
export type RpmWindowStats = Record<string, { arrivals: number; signups: number; firstPaymentCents: number; payers: number }>;

export const getRpmWindowStats = unstable_cache(
  guarded("rpm window", async (endIso: string): Promise<RpmWindowStats> => {
    const end = new Date(endIso);
    const start = new Date(end.getTime() - 7 * DAY_MS);
    const admin = createAdminClient();
    const stats: RpmWindowStats = {};
    const entry = (source: string) => (stats[source] ??= { arrivals: 0, signups: 0, firstPaymentCents: 0, payers: 0 });

    const [visits, { data: signups, error: signupsError }, { data: invoices, error: invoicesError }] = await Promise.all([
      readVisits<{ visitor_id: string; utm_source: string | null; created_at: string }>("visitor_id, utm_source, created_at", start, end, DAY_MS),
      admin.from("profiles").select("utm_source").gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).limit(20_000),
      admin
        .from("stripe_processed_invoices")
        .select("stripe_customer_id, amount_cents, created_at")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .gt("amount_cents", 0)
        .order("created_at")
        .limit(5_000),
    ]);
    if (signupsError) throw new Error(signupsError.message);
    if (invoicesError) throw new Error(invoicesError.message);

    const visitorsBySource = new Map<string, Set<string>>();
    for (const v of visits) {
      if (!v.utm_source) continue;
      if (!visitorsBySource.has(v.utm_source)) visitorsBySource.set(v.utm_source, new Set());
      visitorsBySource.get(v.utm_source)!.add(v.visitor_id);
    }
    for (const [source, visitors] of visitorsBySource) entry(source).arrivals = visitors.size;
    for (const p of signups ?? []) if (p.utm_source) entry(p.utm_source).signups += 1;

    // Premier paiement = première facture du client dans la fenêtre, sans
    // facture plus ancienne.
    const firstInWindow = new Map<string, number>();
    for (const inv of invoices ?? []) if (!firstInWindow.has(inv.stripe_customer_id)) firstInWindow.set(inv.stripe_customer_id, inv.amount_cents);
    const customers = [...firstInWindow.keys()];
    for (let i = 0; i < customers.length; i += 200) {
      const chunk = customers.slice(i, i + 200);
      const [{ data: earlier, error: earlierError }, { data: owners, error: ownersError }] = await Promise.all([
        admin.from("stripe_processed_invoices").select("stripe_customer_id").in("stripe_customer_id", chunk).lt("created_at", start.toISOString()).gt("amount_cents", 0).limit(5_000),
        admin.from("profiles").select("stripe_customer_id, utm_source").in("stripe_customer_id", chunk),
      ]);
      if (earlierError) throw new Error(earlierError.message);
      if (ownersError) throw new Error(ownersError.message);
      const repeat = new Set((earlier ?? []).map((e) => e.stripe_customer_id));
      for (const o of owners ?? []) {
        if (!o.stripe_customer_id || !o.utm_source || repeat.has(o.stripe_customer_id)) continue;
        const e = entry(o.utm_source);
        e.firstPaymentCents += firstInWindow.get(o.stripe_customer_id) ?? 0;
        e.payers += 1;
      }
    }
    return stats;
  }),
  ["admin-rpm-window-v1"],
  { revalidate: 1800 },
);

// Attribution par corrélation (SOP 17) : heure par heure sur 72 h, arrivées,
// inscrits et paiements, pour rapprocher un pic de revenu d'un pic de vues
// (« une vidéo qui monte à 17 h et un spike de revenu à 17 h : le revenu
// vient d'elle »). Paiements limités aux clients Stageio (compte partagé).
export type HourlyAttribution = {
  hour: string;
  arrivals: number;
  signups: number;
  payments: number;
  cents: number;
  topSources: string[];
};

export const getHourlyAttribution = unstable_cache(
  guarded("hourly attribution", async (): Promise<HourlyAttribution[]> => {
    const since = new Date(Date.now() - 72 * HOUR_MS);
    const admin = createAdminClient();
    const [visits, { data: signups, error: signupsError }, { data: invoices, error: invoicesError }] = await Promise.all([
      readVisits<{ visitor_id: string; utm_source: string | null; created_at: string }>("visitor_id, utm_source, created_at", since, new Date(), HOUR_MS),
      admin.from("profiles").select("created_at").gte("created_at", since.toISOString()).limit(20_000),
      admin.from("stripe_processed_invoices").select("stripe_customer_id, amount_cents, created_at").gte("created_at", since.toISOString()).gt("amount_cents", 0).limit(5_000),
    ]);
    if (signupsError) throw new Error(signupsError.message);
    if (invoicesError) throw new Error(invoicesError.message);

    const customers = [...new Set((invoices ?? []).map((i) => i.stripe_customer_id))];
    const owned = new Set<string>();
    for (let i = 0; i < customers.length; i += 200) {
      const { data, error } = await admin.from("profiles").select("stripe_customer_id").in("stripe_customer_id", customers.slice(i, i + 200));
      if (error) throw new Error(error.message);
      for (const p of data ?? []) if (p.stripe_customer_id) owned.add(p.stripe_customer_id);
    }

    const hourKey = (iso: string) => {
      const d = new Date(iso);
      d.setUTCMinutes(0, 0, 0);
      return d.toISOString();
    };
    const hours = new Map<string, { visitors: Set<string>; bySource: Map<string, Set<string>>; signups: number; payments: number; cents: number }>();
    const bucket = (iso: string) => {
      const key = hourKey(iso);
      let b = hours.get(key);
      if (!b) hours.set(key, (b = { visitors: new Set(), bySource: new Map(), signups: 0, payments: 0, cents: 0 }));
      return b;
    };
    for (const v of visits) {
      const b = bucket(v.created_at);
      b.visitors.add(v.visitor_id);
      if (v.utm_source) {
        if (!b.bySource.has(v.utm_source)) b.bySource.set(v.utm_source, new Set());
        b.bySource.get(v.utm_source)!.add(v.visitor_id);
      }
    }
    for (const p of signups ?? []) bucket(p.created_at).signups += 1;
    for (const inv of invoices ?? []) {
      if (!owned.has(inv.stripe_customer_id)) continue;
      const b = bucket(inv.created_at);
      b.payments += 1;
      b.cents += inv.amount_cents;
    }
    return [...hours.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([hour, b]) => ({
        hour,
        arrivals: b.visitors.size,
        signups: b.signups,
        payments: b.payments,
        cents: b.cents,
        topSources: [...b.bySource.entries()].sort((x, y) => y[1].size - x[1].size).slice(0, 2).map(([s, set]) => `${s} (${set.size})`),
      }));
  }),
  ["admin-hourly-attribution-v1"],
  { revalidate: 600 },
);
