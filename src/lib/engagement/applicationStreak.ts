// Série de jours consécutifs avec au moins une vraie candidature -- postuler
// est le seul geste qui compte ici (un like ne suffit pas) : l'objectif est
// de donner une vraie raison de revenir candidater chaque jour, pas juste
// parcourir le deck. Une série ne casse qu'après un jour entier sans
// candidature : ne pas avoir encore postulé AUJOURD'HUI ne la remet pas à
// zéro (sinon elle retomberait à 0 chaque matin avant même d'avoir eu la
// chance de postuler), elle est juste "en jeu" jusqu'à minuit.
export function computeApplicationStreak(appliedDates: string[]): number {
  if (appliedDates.length === 0) return 0;

  const days = new Set(
    appliedDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }),
  );

  const oneDay = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = today.getTime();

  if (!days.has(cursor)) {
    cursor -= oneDay;
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
}
