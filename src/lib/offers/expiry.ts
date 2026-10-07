// Durée de vie d'une offre importée : au-delà, le cron
// deactivate-expired-offers la désactive (probablement pourvue ou expirée).
// Sert aussi de "validThrough" dans le JobPosting de la fiche : Google for
// Jobs doit savoir quand l'offre disparaît réellement du site.
export const OFFER_EXPIRY_DAYS = 30;

export function offerExpiresAt(publishedAt: string): Date {
  const date = new Date(publishedAt);
  date.setDate(date.getDate() + OFFER_EXPIRY_DAYS);
  return date;
}
