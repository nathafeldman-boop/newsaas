export type Period = "7j" | "30j" | "90j" | "tout";

export const PERIOD_DAYS: Record<Exclude<Period, "tout">, number> = {
  "7j": 7,
  "30j": 30,
  "90j": 90,
};

export function periodStart(period: Period): Date | null {
  if (period === "tout") return null;
  const start = new Date();
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  return start;
}

function dateKeyParis(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function isoWeekKey(dateStr: string): string {
  // Semaine ISO (lundi -> dimanche), calculée en heure de Paris.
  const d = new Date(dateKeyParis(dateStr) + "T12:00:00");
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/**
 * Regroupe des inscriptions (created_at + un statut premium/gratuit déjà
 * résolu) en buckets journaliers (périodes <= 30j) ou hebdomadaires
 * (au-delà), pour le graphe "Inscriptions" du dashboard admin. Le statut
 * pris en compte est celui d'AUJOURD'HUI, pas celui du jour d'inscription
 * (qu'on ne peut pas reconstituer sans historiser subscription_status) --
 * une approximation assumée pour un graphe de vue d'ensemble.
 */
export function bucketizeSignups(
  rows: { created_at: string; isPremium: boolean }[],
  period: Period,
): { label: string; gratuit: number; premium: number }[] {
  const days = period === "tout" ? null : PERIOD_DAYS[period];
  const weekly = days === null || days > 30;
  const keyFn = weekly ? isoWeekKey : dateKeyParis;

  const buckets = new Map<string, { gratuit: number; premium: number }>();
  for (const row of rows) {
    const key = keyFn(row.created_at);
    const bucket = buckets.get(key) ?? { gratuit: 0, premium: 0 };
    if (row.isPremium) bucket.premium++;
    else bucket.gratuit++;
    buckets.set(key, bucket);
  }

  const sortedKeys = [...buckets.keys()].sort();
  return sortedKeys.map((key) => {
    const b = buckets.get(key)!;
    const d = new Date(`${key}T12:00:00`);
    const label = weekly
      ? `Sem. ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`
      : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    return { label, gratuit: b.gratuit, premium: b.premium };
  });
}

/**
 * Moyenne de visiteurs distincts (visitor_id) par jour de semaine (0=lundi
 * ... 6=dimanche), sur l'ensemble des visites fournies.
 */
export function computeWeekdayAverages(
  visits: { visitor_id: string; created_at: string }[],
): number[] {
  const byDate = new Map<string, Set<string>>();
  for (const v of visits) {
    const key = dateKeyParis(v.created_at);
    if (!byDate.has(key)) byDate.set(key, new Set());
    byDate.get(key)!.add(v.visitor_id);
  }

  const sums = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];
  for (const [key, visitors] of byDate) {
    const d = new Date(`${key}T12:00:00`);
    const isoDay = (d.getDay() + 6) % 7;
    sums[isoDay] += visitors.size;
    counts[isoDay] += 1;
  }

  return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
}
