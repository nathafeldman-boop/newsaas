// Défi d'un an (29/10/2026, Nathan : « on a 1 an avec mon associé pour
// faire les 100 000 euros ») : encaissé net de Stageio depuis le premier
// paiement (le même chiffre que la jauge du revenu total), à atteindre d'ici
// la fin du 29 octobre 2027, heure de Paris. Fichier pur, testable.

const DAY_MS = 86_400_000;

export const CHALLENGE = {
  goalCents: 10_000_000,
  start: Date.parse("2026-10-29T16:00:00Z"),
  // Minuit à Paris, le 29/10/2027 au soir (heure d'été, UTC+2).
  end: Date.parse("2027-10-29T22:00:00Z"),
  endLabel: "29 octobre 2027",
};

export type ChallengeState = {
  reached: boolean;
  over: boolean;
  remainingCents: number;
  daysLeft: number;
  /** Part du temps écoulée et part de l'objectif atteinte (0 à 1). */
  timeShare: number;
  moneyShare: number;
  /** Encaissement nécessaire, par jour et par mois de 30 jours, pour finir à l'heure. */
  neededPerDayCents: number | null;
  neededPerMonthCents: number | null;
  /** Rythme mesuré (30 derniers jours) et total atteint à la fin à ce rythme. */
  pacePerDayCents: number;
  projectedCents: number;
};

export function challengeState(params: { now: number; totalCents: number; last30Cents: number }): ChallengeState {
  const { now, totalCents, last30Cents } = params;
  const { goalCents, start, end } = CHALLENGE;
  const msLeft = Math.max(0, end - now);
  const daysLeft = msLeft / DAY_MS;
  const remainingCents = Math.max(0, goalCents - totalCents);
  const pacePerDayCents = Math.max(0, last30Cents) / 30;
  const neededPerDay = daysLeft > 0 && remainingCents > 0 ? remainingCents / daysLeft : null;
  return {
    reached: totalCents >= goalCents,
    over: msLeft === 0,
    remainingCents,
    daysLeft,
    timeShare: Math.min(1, Math.max(0, (now - start) / (end - start))),
    moneyShare: Math.min(1, Math.max(0, totalCents / goalCents)),
    neededPerDayCents: neededPerDay === null ? null : Math.round(neededPerDay),
    neededPerMonthCents: neededPerDay === null ? null : Math.round(neededPerDay * 30),
    pacePerDayCents: Math.round(pacePerDayCents),
    projectedCents: Math.round(totalCents + pacePerDayCents * daysLeft),
  };
}

/** Temps restant découpé pour l'affichage (jours, heures, minutes, secondes). */
export function countdownParts(msLeft: number): { days: number; hours: number; minutes: number; seconds: number } {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return { days: Math.floor(s / 86_400), hours: Math.floor((s % 86_400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
