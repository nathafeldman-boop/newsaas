// Durée de vie d'une offre importée : au-delà, le cron
// deactivate-expired-offers la désactive (probablement pourvue ou expirée).
// Sert aussi de "validThrough" dans le JobPosting de la fiche : Google for
// Jobs doit savoir quand l'offre disparaît réellement du site.
export const OFFER_EXPIRY_DAYS = 30;

// Une offre plus vieille que OFFER_EXPIRY_DAYS reste en ligne tant que sa
// source la montre encore (last_seen_at mis à jour à chaque synchro) : sinon
// le cron la désactivait à 3 h et la synchro de 4 h la réactivait, et la
// fiche basculait chaque jour entre « active » et « expirée » (mauvais pour
// Google Jobs). Elle n'est retirée qu'après OFFER_UNSEEN_GRACE_DAYS jours
// sans être revue.
export const OFFER_UNSEEN_GRACE_DAYS = 2;

export function offerExpiresAt(publishedAt: string): Date {
  const date = new Date(publishedAt);
  date.setDate(date.getDate() + OFFER_EXPIRY_DAYS);
  return date;
}

// Date à laquelle le cron retirera au plus tôt l'offre : "validThrough" du
// JobPosting. Jamais dans le passé tant que la fiche est en ligne.
export function offerRemovalDate(publishedAt: string, lastSeenAt: string | null, now = Date.now()): Date {
  const candidates = [offerExpiresAt(publishedAt).getTime(), now + 24 * 3600 * 1000];
  if (lastSeenAt) candidates.push(new Date(lastSeenAt).getTime() + OFFER_UNSEEN_GRACE_DAYS * 24 * 3600 * 1000);
  return new Date(Math.max(...candidates));
}
