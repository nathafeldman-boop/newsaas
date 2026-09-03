export const PARIS_TZ = "Europe/Paris";

/**
 * Minuit (heure de Paris) du jour courant, retourné comme instant UTC réel.
 * `new Date(); .setHours(0,0,0,0)` calcule minuit dans le fuseau du
 * *serveur* qui exécute le code (UTC sur Vercel), pas celui de l'utilisateur
 * -- l'écart avec l'heure de Paris (+1h ou +2h selon la saison) décalait les
 * compteurs "aujourd'hui" et l'affichage des heures sur le dashboard admin.
 */
export function startOfTodayParis(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const parisWallClockAsUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  const offsetMs = parisWallClockAsUTC - now.getTime();
  const parisMidnightWallClockAsUTC = Date.UTC(get("year"), get("month") - 1, get("day"), 0, 0, 0);
  return new Date(parisMidnightWallClockAsUTC - offsetMs);
}
