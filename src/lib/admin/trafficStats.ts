// Calculs du trafic et des inscriptions, sans accès à la base (testables) :
// sources, jours de Paris, rapprochement visiteurs / inscrits / payeurs,
// tendances jour par jour. Lectures dans lib/admin/traffic.ts.

export const DAY_MS = 86_400_000;
/** 4 septembre 2026, 0 h à Paris : début des inscriptions suivies. */
export const SIGNUPS_SINCE = Date.parse("2026-09-03T22:00:00Z");
/** Visites fiables à partir de là (= VISITS_CLEAN_SINCE de dashboardStats). */
export const VISITS_RELIABLE_SINCE = Date.parse("2026-10-08T12:15:00Z");

type SourceInfo = { label: string; group: SourceGroup };
export type SourceGroup = "Réseaux sociaux" | "Moteurs de recherche" | "Assistants IA" | "E-mails Stageio" | "Partages" | "Direct / inconnu" | "Autres";

const KNOWN: Record<string, SourceInfo> = {
  tiktok: { label: "TikTok", group: "Réseaux sociaux" },
  instagram: { label: "Instagram", group: "Réseaux sociaux" },
  facebook: { label: "Facebook", group: "Réseaux sociaux" },
  snapchat: { label: "Snapchat", group: "Réseaux sociaux" },
  youtube: { label: "YouTube", group: "Réseaux sociaux" },
  linkedin: { label: "LinkedIn", group: "Réseaux sociaux" },
  x: { label: "X (Twitter)", group: "Réseaux sociaux" },
  reddit: { label: "Reddit", group: "Réseaux sociaux" },
  whatsapp: { label: "WhatsApp", group: "Réseaux sociaux" },
  google: { label: "Google", group: "Moteurs de recherche" },
  bing: { label: "Bing", group: "Moteurs de recherche" },
  duckduckgo: { label: "DuckDuckGo", group: "Moteurs de recherche" },
  "autre-moteur": { label: "Autres moteurs", group: "Moteurs de recherche" },
  chatgpt: { label: "ChatGPT", group: "Assistants IA" },
  perplexity: { label: "Perplexity", group: "Assistants IA" },
  gemini: { label: "Gemini", group: "Assistants IA" },
  copilot: { label: "Copilot", group: "Assistants IA" },
  claude: { label: "Claude", group: "Assistants IA" },
  "meta-ai": { label: "Meta AI", group: "Assistants IA" },
  grok: { label: "Grok", group: "Assistants IA" },
  deepseek: { label: "DeepSeek", group: "Assistants IA" },
  mistral: { label: "Le Chat (Mistral)", group: "Assistants IA" },
  email: { label: "E-mails Stageio", group: "E-mails Stageio" },
  partage: { label: "Boutons de partage", group: "Partages" },
  direct: { label: "Direct / inconnu", group: "Direct / inconnu" },
};

/** Source telle que rangée dans les tableaux : minuscules, « direct » si aucune. */
export const sourceKey = (raw: string | null | undefined) => (raw ?? "").trim().toLowerCase() || "direct";

// Variantes vues dans les liens posés à la main (bio, stories, pubs).
const ALIASES: Record<string, string> = {
  tt: "tiktok",
  "tiktok.com": "tiktok",
  ig: "instagram",
  insta: "instagram",
  "instagram.com": "instagram",
  fb: "facebook",
  yt: "youtube",
  snap: "snapchat",
  twitter: "x",
  "t.co": "x",
  mail: "email",
  newsletter: "email",
};

export function sourceInfo(source: string | null | undefined): SourceInfo {
  const raw = sourceKey(source);
  const key = ALIASES[raw] ?? raw;
  return KNOWN[key] ?? { label: key, group: "Autres" };
}

export type DaySource = { day: string; source: string; visitors: number };
export type SourceVisitors = { source: string; visitors: number; signupPageVisitors: number };

const parisDay = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
export const dayKey = (t: number) => parisDay.format(t);

/** Jours (clés AAAA-MM-JJ, heure de Paris) de `since` à `until` inclus. */
export function daysBetween(since: number, until: number): { key: string; t: number }[] {
  const out: { key: string; t: number }[] = [];
  const seen = new Set<string>();
  // Pas de 6 h puis dédoublonnage : robuste aux changements d'heure.
  for (let t = since; t <= until; t += 6 * 3600_000) {
    const key = dayKey(t);
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ key, t: Date.parse(`${key}T12:00:00Z`) });
    }
  }
  const last = dayKey(until);
  if (!seen.has(last)) out.push({ key: last, t: Date.parse(`${last}T12:00:00Z`) });
  return out;
}

// --- Inscrits --------------------------------------------------------------

export type SignupDay = { day: string; signups: number; onboarded: number; sources: Record<string, number> };
export type SignupRow = { created_at: string; utm_source: string | null; onboarding_completed: boolean | null };

/** Inscrits par jour (heure de Paris), dont onboarding terminé, par source. */
export function aggregateSignups(rows: SignupRow[]): SignupDay[] {
  const byDay = new Map<string, SignupDay>();
  for (const r of rows) {
    const day = dayKey(Date.parse(r.created_at));
    const entry = byDay.get(day) ?? { day, signups: 0, onboarded: 0, sources: {} };
    entry.signups++;
    if (r.onboarding_completed) entry.onboarded++;
    const source = sourceKey(r.utm_source);
    entry.sources[source] = (entry.sources[source] ?? 0) + 1;
    byDay.set(day, entry);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

// --- Rapprochement visiteurs / inscrits / payeurs ---------------------------

export type SourceRow = { label: string; group: SourceGroup; visitors: number; signupPage: number; signups: number; payers: number | null };

/**
 * Une ligne par source (libellé fusionné : « ig » et « instagram » ne font
 * qu'un), sur les jours `days`. Visiteurs : première source de la période ;
 * inscrits et payeurs : source enregistrée à l'inscription.
 */
export function mergeBySource(
  visitors: SourceVisitors[] | null,
  signups: SignupDay[],
  payers: { day: string; source: string }[] | null,
  days: Set<string>,
): SourceRow[] {
  const rows = new Map<string, SourceRow>();
  const row = (source: string) => {
    const info = sourceInfo(source);
    const cur = rows.get(info.label) ?? { label: info.label, group: info.group, visitors: 0, signupPage: 0, signups: 0, payers: payers ? 0 : null };
    rows.set(info.label, cur);
    return cur;
  };
  for (const v of visitors ?? []) {
    const r = row(v.source);
    r.visitors += v.visitors;
    r.signupPage += v.signupPageVisitors;
  }
  for (const d of signups) {
    if (!days.has(d.day)) continue;
    for (const [source, n] of Object.entries(d.sources)) row(source).signups += n;
  }
  for (const p of payers ?? []) {
    if (!days.has(p.day)) continue;
    const r = row(p.source);
    r.payers = (r.payers ?? 0) + 1;
  }
  return [...rows.values()].sort((a, b) => b.visitors - a.visitors || b.signups - a.signups || a.label.localeCompare(b.label));
}

export function totalsByGroup(rows: SourceRow[]): (Omit<SourceRow, "label" | "group"> & { group: SourceGroup })[] {
  const out = new Map<SourceGroup, Omit<SourceRow, "label" | "group"> & { group: SourceGroup }>();
  for (const r of rows) {
    const g = out.get(r.group) ?? { group: r.group, visitors: 0, signupPage: 0, signups: 0, payers: r.payers === null ? null : 0 };
    g.visitors += r.visitors;
    g.signupPage += r.signupPage;
    g.signups += r.signups;
    if (g.payers !== null && r.payers !== null) g.payers += r.payers;
    out.set(r.group, g);
  }
  return [...out.values()].sort((a, b) => b.visitors - a.visitors || b.signups - a.signups);
}

// --- Tendance des inscriptions ---------------------------------------------

export type DayTrend = {
  key: string;
  t: number;
  /** 0 = dimanche … 6 = samedi. */
  weekday: number;
  signups: number;
  onboarded: number;
  /** Écart avec la veille (null le premier jour). */
  diff: number | null;
  /** Moyenne des 7 jours qui finissent ce jour-là (null avant le 7e jour et pour la journée en cours). */
  avg7: number | null;
  cumul: number;
  topSource: { label: string; count: number } | null;
  isToday: boolean;
};

/** Une ligne par jour de `days`, jours sans inscrit compris (0). */
export function signupTrend(days: { key: string; t: number }[], signupDays: SignupDay[], todayKey: string): DayTrend[] {
  const byKey = new Map(signupDays.map((d) => [d.day, d]));
  const out: DayTrend[] = [];
  let cumul = 0;
  days.forEach(({ key, t }, i) => {
    const d = byKey.get(key);
    const signups = d?.signups ?? 0;
    cumul += signups;
    const bySource = new Map<string, number>();
    for (const [source, n] of Object.entries(d?.sources ?? {})) {
      const label = sourceInfo(source).label;
      bySource.set(label, (bySource.get(label) ?? 0) + n);
    }
    const top = [...bySource.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const window = i >= 6 && key !== todayKey ? [...out.slice(i - 6).map((x) => x.signups), signups] : null;
    out.push({
      key,
      t,
      weekday: new Date(`${key}T12:00:00Z`).getUTCDay(),
      signups,
      onboarded: d?.onboarded ?? 0,
      diff: i > 0 ? signups - out[i - 1].signups : null,
      avg7: window ? window.reduce((s, n) => s + n, 0) / 7 : null,
      cumul,
      topSource: top ? { label: top[0], count: top[1] } : null,
      isToday: key === todayKey,
    });
  });
  return out;
}

export type TrendSummary = {
  total: number;
  today: number;
  yesterday: number | null;
  /** Meilleur jour (aujourd'hui compris) ; le plus récent en cas d'égalité. */
  record: DayTrend | null;
  /** Jour le plus bas parmi les jours terminés ; le plus récent en cas d'égalité. */
  low: DayTrend | null;
  /** Moyenne par jour terminé (aujourd'hui exclu : journée incomplète). */
  avgPerDay: number | null;
  last7: number | null;
  prev7: number | null;
  /** Moyenne par jour de la semaine (jours terminés), 0 = dimanche. */
  weekdayAvg: (number | null)[];
};

export function summarizeTrend(trend: DayTrend[]): TrendSummary {
  const done = trend.filter((d) => !d.isToday);
  const today = trend.find((d) => d.isToday);
  const pick = (list: DayTrend[], better: (a: number, b: number) => boolean) =>
    list.reduce<DayTrend | null>((best, d) => (!best || better(d.signups, best.signups) || d.signups === best.signups ? d : best), null);
  const sum = (list: DayTrend[]) => list.reduce((s, d) => s + d.signups, 0);
  const weekdayAvg = [0, 1, 2, 3, 4, 5, 6].map((w) => {
    const list = done.filter((d) => d.weekday === w);
    return list.length > 0 ? sum(list) / list.length : null;
  });
  return {
    total: sum(trend),
    today: today?.signups ?? 0,
    yesterday: done.length > 0 ? done[done.length - 1].signups : null,
    record: pick(trend, (a, b) => a > b),
    low: pick(done, (a, b) => a < b),
    avgPerDay: done.length > 0 ? sum(done) / done.length : null,
    last7: done.length >= 7 ? sum(done.slice(-7)) : null,
    prev7: done.length >= 14 ? sum(done.slice(-14, -7)) : null,
    weekdayAvg,
  };
}

export type WeekTotal = {
  start: string;
  end: string;
  signups: number;
  days: number;
  /** Semaine qui contient la journée en cours. */
  current: boolean;
  /** Inscrits par jour terminé (la journée en cours n'est pas comptée). */
  perDay: number | null;
};

/** Totaux par semaine (lundi → dimanche), la plus récente en dernier. */
export function weeklyTotals(trend: DayTrend[]): WeekTotal[] {
  const weeks: DayTrend[][] = [];
  for (const d of trend) {
    if (weeks.length === 0 || d.weekday === 1) weeks.push([]);
    weeks[weeks.length - 1].push(d);
  }
  return weeks.map((list) => {
    const done = list.filter((d) => !d.isToday);
    return {
      start: list[0].key,
      end: list[list.length - 1].key,
      signups: list.reduce((s, d) => s + d.signups, 0),
      days: list.length,
      current: list.some((d) => d.isToday),
      perDay: done.length > 0 ? done.reduce((s, d) => s + d.signups, 0) / done.length : null,
    };
  });
}
