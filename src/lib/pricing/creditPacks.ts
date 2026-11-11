// Upsell « candidatures en plus » (11/11, Nathan) : paiements uniques, sans
// abonnement. Les crédits servent quand la limite de 100 candidatures
// automatiques par jour est atteinte, ou pour un compte Premium sans la
// formule Auto. Ils n'expirent pas.

export type CreditPack = { id: string; credits: number; cents: number; badge?: string };

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "c25", credits: 25, cents: 400 },
  { id: "c50", credits: 50, cents: 500 },
  { id: "c100", credits: 100, cents: 700 },
  { id: "c250", credits: 250, cents: 1000, badge: "Le plus pris" },
  { id: "c500", credits: 500, cents: 1500 },
  { id: "c1500", credits: 1500, cents: 2000 },
  { id: "c10000", credits: 10000, cents: 4000, badge: "Big pack" },
];

// Levée de la pause de 4 h (25 envois automatiques en 4 h), pendant 24 h.
export const PACE_UNLOCK = { id: "pace24h", cents: 200, hours: 24 } as const;

export type UpsellKind = "auto_credits" | "pace_unlock";

export function findCreditPack(id: unknown): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}

export function euros(cents: number): string {
  return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2).replace(".", ",")} €`;
}

/** Prix par candidature, en centimes arrondis : « 4 c » pour le big pack. */
export function centsPerApplication(pack: CreditPack): number {
  return Math.round((pack.cents / pack.credits) * 10) / 10;
}

/** Fin de la levée de pause si l'achat se fait à `now` (ms). Cumulable : repart de la fin en cours. */
export function paceFreeUntil(currentIso: string | null | undefined, now: number): string {
  const current = currentIso ? Date.parse(currentIso) : NaN;
  const base = Number.isFinite(current) && current > now ? current : now;
  return new Date(base + PACE_UNLOCK.hours * 3600_000).toISOString();
}

export function isPaceFree(untilIso: string | null | undefined, now: number): boolean {
  if (!untilIso) return false;
  const until = Date.parse(untilIso);
  return Number.isFinite(until) && until > now;
}
