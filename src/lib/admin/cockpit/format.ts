import { PARIS_TZ } from "@/lib/date";
import { DAY_MS, type Range } from "@/lib/admin/cockpit/metrics";

export function euros(cents: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? Math.abs(cents) < 100_000;
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })} €`;
}

export function pct(ratio: number | null, digits = 1): string {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
}

export function int(n: number): string {
  return n.toLocaleString("fr-FR");
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS_TZ, day: "numeric", month: "short" });
const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS_TZ, day: "2-digit", month: "2-digit", year: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: PARIS_TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const shortDay = (t: number) => dayFmt.format(t);
export const date = (t: number | null) => (t ? dateFmt.format(t) : "—");
export const dateTime = (t: number | null) => (t ? dateTimeFmt.format(t) : "—");

/** « m•••@gmail.com » : de quoi reconnaître un compte sans afficher l'adresse. */
export function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  return `${local.slice(0, 1)}•••@${domain}`;
}

/** Minuit (heure de Paris) du jour qui contient t. */
export function startOfParisDay(t: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(t);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  const offset = wall - Math.floor(t / 1000) * 1000;
  return Date.UTC(get("year"), get("month") - 1, get("day")) - offset;
}

export const PERIODS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIODS)[number];

export function parsePeriod(raw: string | string[] | undefined): PeriodDays {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as PeriodDays) : 30;
}

/** Période courante (jours entiers à Paris, aujourd'hui compris) et la précédente, de même durée. */
export function periodRanges(days: PeriodDays, now: number): { current: Range; previous: Range } {
  const end = startOfParisDay(now) + DAY_MS;
  const start = end - days * DAY_MS;
  return { current: { start, end }, previous: { start: start - days * DAY_MS, end: start } };
}

/** Mois « YYYY-MM » (heure de Paris approximée en UTC+1) → bornes. */
export function monthRange(raw: string | string[] | undefined, now: number): { key: string; range: Range } {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const key = value && /^\d{4}-\d{2}$/.test(value) ? value : new Date(now).toISOString().slice(0, 7);
  const [y, m] = key.split("-").map(Number);
  return { key, range: { start: startOfParisDay(Date.UTC(y, m - 1, 1, 12)), end: startOfParisDay(Date.UTC(y, m, 1, 12)) } };
}

/** Variation signée vs période précédente : texte et sens (+ / − / =). */
export function delta(current: number, previous: number, format: (n: number) => string = int): { text: string; direction: "up" | "down" | "flat" } {
  const diff = current - previous;
  if (diff === 0) return { text: "= vs période préc.", direction: "flat" };
  const sign = diff > 0 ? "+" : "−";
  const rel = previous !== 0 ? ` (${sign}${Math.abs(Math.round((diff / previous) * 100))} %)` : "";
  return { text: `${sign}${format(Math.abs(diff))}${rel} vs période préc.`, direction: diff > 0 ? "up" : "down" };
}
