// Satisfaction des abonnés (Nathan, 29/10 : « bosse sur la satisfaction
// client »). Une seule question, posée dans le tableau de bord, à des moments
// fixes après le paiement : peu après (les résiliations arrivent surtout le
// premier jour : 18 sur 117 abonnements mensuels, données Stripe du 29/10),
// puis vers J+14 et J+30. Une note de 1 à 5, un commentaire libre. Note de 1
// ou 2 : Nathan est prévenu par email pour répondre lui-même. Fichier pur,
// testable.

export const SATISFACTION_EVENT = "satisfaction_vote";
export const SATISFACTION_DISMISS_EVENT = "satisfaction_dismissed";

export type SurveyMoment = "debut" | "j14" | "j30";

export const SURVEY_MOMENTS: Record<SurveyMoment, { label: string; afterMs: number }> = {
  debut: { label: "Premiers jours", afterMs: 2 * 3_600_000 },
  j14: { label: "Après 2 semaines", afterMs: 14 * 86_400_000 },
  j30: { label: "Après 1 mois", afterMs: 30 * 86_400_000 },
};

/** Après « Plus tard » : plus de question pendant 3 jours. */
export const DISMISS_PAUSE_MS = 3 * 86_400_000;

export const SCORE_LABELS: Record<number, string> = {
  1: "Pas du tout",
  2: "Pas vraiment",
  3: "Moyen",
  4: "Oui",
  5: "Carrément",
};

/** Note qui prévient Nathan (client mécontent). */
export const UNHAPPY_MAX_SCORE = 2;

/**
 * Moment de la question à poser maintenant, ou null. Chaque moment n'est
 * posé qu'une fois (vote reçu après son seuil), le dernier atteint d'abord.
 */
export function surveyMomentFor(params: {
  paidAt: number | null;
  votes: { at: number }[];
  dismissedAt: number | null;
  now: number;
}): SurveyMoment | null {
  const { paidAt, votes, dismissedAt, now } = params;
  if (paidAt === null || !Number.isFinite(paidAt)) return null;
  if (dismissedAt !== null && now - dismissedAt < DISMISS_PAUSE_MS) return null;
  for (const moment of ["j30", "j14", "debut"] as const) {
    const opensAt = paidAt + SURVEY_MOMENTS[moment].afterMs;
    if (now < opensAt) continue;
    return votes.some((v) => v.at >= opensAt) ? null : moment;
  }
  return null;
}

export type SatisfactionVote = { at: number; score: number; comment: string | null; moment: string | null; userId: string };

/** CSAT : part des notes 4 et 5 ; moyenne ; répartition. */
export function satisfactionSummary(votes: Pick<SatisfactionVote, "score">[]) {
  const counts = [1, 2, 3, 4, 5].map((s) => votes.filter((v) => v.score === s).length);
  const n = votes.length;
  return {
    n,
    csat: n > 0 ? (counts[3] + counts[4]) / n : null,
    average: n > 0 ? votes.reduce((s, v) => s + v.score, 0) / n : null,
    counts,
  };
}
