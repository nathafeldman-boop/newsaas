import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import type { Range } from "@/lib/admin/cockpit/metrics";
import { AUTO_MONTHLY_PRICE_IDS } from "@/lib/pricing/plans";

// Statistiques d'un test de prix (onglet Tests, 29/10). Fonctions pures,
// testables. Le chiffre qui tranche : le revenu par personne qui voit le
// paywall (1ers paiements encaissés ÷ personnes qui ont vu la page Premium).
// Un prix plus haut peut faire moins de payants et plus d'argent : seul ce
// chiffre dit lequel des deux l'emporte. Le verdict donne la probabilité que
// l'écart soit réel et pas un hasard des petits nombres, jamais une
// certitude.

export type BuyerPlan = "premium_monthly" | "premium_lifetime" | "auto_monthly" | "auto_lifetime";

export const PLAN_LABELS: Record<BuyerPlan, string> = {
  premium_monthly: "Premium mensuel",
  premium_lifetime: "Premium à vie",
  auto_monthly: "Auto mensuel",
  auto_lifetime: "Auto à vie",
};

export type Purchase = {
  userId: string | null;
  customer: string | null;
  t: number;
  cents: number;
  plan: BuyerPlan;
  /** Premier paiement du compte ; sinon une montée en gamme (Premium → Auto). */
  first: boolean;
};

const inRange = (t: number, r: Range) => t >= r.start && t < r.end;

/** Paiements d'achat dans la période : 1re facture payée d'un abonnement, achats à vie. */
export function purchasesIn(snap: StripeSnapshot, range: Range): Purchase[] {
  const firstInvoice = new Map<string, { t: number; cents: number }>();
  for (const inv of snap.invoices) {
    if (!inv.subscription || inv.status !== "paid" || inv.amountPaid <= 0) continue;
    const t = inv.paidAt ?? inv.created;
    const prev = firstInvoice.get(inv.subscription);
    if (!prev || t < prev.t) firstInvoice.set(inv.subscription, { t, cents: inv.amountPaid });
  }
  const all: Purchase[] = [];
  for (const s of snap.subs) {
    const f = firstInvoice.get(s.id);
    if (!f) continue;
    const auto = s.priceIds.some((id) => AUTO_MONTHLY_PRICE_IDS.includes(id));
    all.push({ userId: s.userId, customer: s.customer, t: f.t, cents: f.cents, plan: auto ? "auto_monthly" : "premium_monthly", first: false });
  }
  for (const o of snap.oneTime) {
    // Premium à vie : 30 € à 63,99 € ; Auto à vie : 80 € ou 128 €.
    all.push({ userId: o.userId, customer: o.customer, t: o.created, cents: o.amountCents, plan: o.amountCents >= 8000 ? "auto_lifetime" : "premium_lifetime", first: false });
  }
  // Premier paiement de chaque compte (client Stripe, sinon profil).
  const firstAt = new Map<string, number>();
  const key = (p: Purchase) => p.customer ?? p.userId ?? "";
  for (const p of all) {
    const k = key(p);
    if (k && (!firstAt.has(k) || p.t < firstAt.get(k)!)) firstAt.set(k, p.t);
  }
  return all
    .filter((p) => inRange(p.t, range))
    .map((p) => ({ ...p, first: !key(p) || firstAt.get(key(p)) === p.t }))
    .sort((a, b) => a.t - b.t);
}

export type ArmStats = {
  viewers: number;
  checkouts: number;
  buyers: number;
  conversion: number | null;
  revenueCents: number;
  /** Revenu par personne qui voit le paywall (centimes). */
  rpvCents: number | null;
  aovCents: number | null;
  byPlan: Record<BuyerPlan, { count: number; cents: number }>;
  upgrades: { count: number; cents: number };
  /** Montants des 1ers paiements (calcul de la probabilité). */
  amounts: number[];
};

/**
 * Une période du test. keep(userId) : segment (tout le monde, ou hors offre
 * 48 h par email). Un paiement sans compte relié n'entre que dans « tout le
 * monde » (keep(null)).
 */
export function armStats(input: { viewers: string[]; checkouts: string[]; purchases: Purchase[] }, keep: (userId: string | null) => boolean = () => true): ArmStats {
  const viewers = new Set(input.viewers.filter((u) => keep(u)));
  const checkouts = new Set(input.checkouts.filter((u) => keep(u)));
  const firsts = input.purchases.filter((p) => p.first && keep(p.userId));
  const ups = input.purchases.filter((p) => !p.first && keep(p.userId));
  const byPlan = { premium_monthly: { count: 0, cents: 0 }, premium_lifetime: { count: 0, cents: 0 }, auto_monthly: { count: 0, cents: 0 }, auto_lifetime: { count: 0, cents: 0 } };
  for (const p of firsts) {
    byPlan[p.plan].count += 1;
    byPlan[p.plan].cents += p.cents;
  }
  const revenueCents = firsts.reduce((s, p) => s + p.cents, 0);
  return {
    viewers: viewers.size,
    checkouts: checkouts.size,
    buyers: firsts.length,
    conversion: viewers.size > 0 ? firsts.length / viewers.size : null,
    revenueCents,
    rpvCents: viewers.size > 0 ? revenueCents / viewers.size : null,
    aovCents: firsts.length > 0 ? revenueCents / firsts.length : null,
    byPlan,
    upgrades: { count: ups.length, cents: ups.reduce((s, p) => s + p.cents, 0) },
    amounts: firsts.map((p) => p.cents),
  };
}

// --- Probabilité que le test rapporte plus ----------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// Loi gamma (Marsaglia et Tsang), forme ≥ 1.
function gamma(shape: number, rand: () => number): number {
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function beta(a: number, b: number, rand: () => number): number {
  const x = gamma(a, rand);
  return x / (x + gamma(b, rand));
}

function bootstrapMean(amounts: number[], rand: () => number): number {
  let sum = 0;
  for (let i = 0; i < amounts.length; i++) sum += amounts[Math.floor(rand() * amounts.length)];
  return sum / amounts.length;
}

/**
 * Probabilité que le revenu par personne du test dépasse celui d'avant :
 * taux de paiement tiré d'une loi bêta (payants / personnes), panier moyen
 * rééchantillonné parmi les vrais paiements (les deux périodes réunies
 * quand une période n'en a aucun). Tirages reproductibles (graine fixe).
 */
export function probabilityTestBetter(control: Pick<ArmStats, "viewers" | "buyers" | "amounts">, test: Pick<ArmStats, "viewers" | "buyers" | "amounts">, draws = 4000, seed = 2910): number | null {
  if (control.viewers === 0 || test.viewers === 0) return null;
  const pooled = [...control.amounts, ...test.amounts];
  if (pooled.length === 0) return null;
  const rand = mulberry32(seed);
  const rpv = (arm: Pick<ArmStats, "viewers" | "buyers" | "amounts">) => {
    const buyers = Math.min(arm.buyers, arm.viewers);
    const rate = beta(1 + buyers, 1 + arm.viewers - buyers, rand);
    return rate * bootstrapMean(arm.amounts.length > 0 ? arm.amounts : pooled, rand);
  };
  let wins = 0;
  for (let i = 0; i < draws; i++) if (rpv(test) > rpv(control)) wins++;
  return wins / draws;
}

export type Verdict = { tone: "good" | "bad" | "neutral" | "wait"; title: string; detail: string };

/** Assez de monde pour lire quelque chose : 50 personnes par période et 8 payants en tout. */
export const MIN_VIEWERS = 50;
export const MIN_BUYERS = 8;

export function verdictFor(control: ArmStats, test: ArmStats, prob: number | null, finished: boolean): Verdict {
  const lead = finished ? "" : "Tendance pour l'instant : ";
  if (control.viewers < MIN_VIEWERS || test.viewers < MIN_VIEWERS || control.buyers + test.buyers < MIN_BUYERS || prob === null) {
    return {
      tone: "wait",
      title: finished ? "Pas assez de données pour trancher" : "Trop tôt pour trancher",
      detail: `Il faut au moins ${MIN_VIEWERS} personnes sur le paywall dans chaque période et ${MIN_BUYERS} payants en tout (aujourd'hui : ${control.viewers} et ${test.viewers} personnes, ${control.buyers + test.buyers} payants).`,
    };
  }
  const change = control.rpvCents && test.rpvCents !== null ? Math.round(((test.rpvCents - control.rpvCents) / control.rpvCents) * 100) : null;
  const changeText = change === null ? "" : `${change > 0 ? "+" : ""}${change} % de revenu par personne qui voit le paywall. `;
  const pct = Math.round(prob * 100);
  if (prob >= 0.9) {
    return { tone: "good", title: `${lead}concluant, les nouveaux prix rapportent plus`, detail: `${changeText}Probabilité que les nouveaux prix rapportent vraiment plus : ${pct} %.` };
  }
  if (prob <= 0.1) {
    return { tone: "bad", title: `${lead}pas concluant, les anciens prix rapportaient plus`, detail: `${changeText}Probabilité que les nouveaux prix rapportent plus : seulement ${pct} %.` };
  }
  return {
    tone: "neutral",
    title: `${lead}pas de gagnant net`,
    detail: `${changeText}Probabilité que les nouveaux prix rapportent plus : ${pct} % (on tranche sous 10 % ou au-dessus de 90 %). L'écart peut encore venir du hasard des petits nombres.`,
  };
}
