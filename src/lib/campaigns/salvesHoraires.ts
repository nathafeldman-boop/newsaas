// Salves horaires (Nathan, 5/11 : « Programme des emails pour toutes les
// heures, on veut 100 par heure à partir de 15h »). Fichier sans dépendance :
// lu par la route cron /api/cron/salves-horaires et par les tests.
//
// - Un passage par heure, de 12 h à 21 h (heure de Paris) depuis le 6/11
//   (Nathan : « tous les jours, je veux 1000 emails envoyés, des emails qui
//   convertissent ») : 10 passages de 100, 1 000 emails par jour au plus,
//   jusqu'à ce qu'il n'y ait plus personne à qui écrire.
// - D'abord la relance « nouvelles offres » (l'email qui a vendu le 6/11,
//   bouton Premium sans connexion), puis le « Dernier appel » quand il n'y a
//   plus personne pour la première. Les emails qui ne parlent que de prix ne
//   faisaient presque plus cliquer (0,4 % pour le Dernier appel). Mêmes
//   garde-fous que /admin/relance : jamais deux fois le même email au même
//   compte, désabonnés, payants et plafond par 24 h exclus.
// - Garde contre un double appel (Vercel peut rappeler une route, un clic
//   dans l'admin peut tomber dans l'heure) : 100 emails au plus par tranche
//   de 50 minutes, tous déclencheurs confondus.
// - Personne ne reçoit une salve dans les 3 h qui suivent un email de la
//   série Premium (elle passe à la demie) ou une relance de paiement, ni dans
//   les 24 h qui suivent un autre email de salve : il sera pris plus tard.

import type { CampaignId } from "@/lib/campaigns/relanceOffres";

export const HOURLY_SALVE_SIZE = 100;
// 14 h UTC = 15 h à Paris (heure d'hiver).
export const HOURLY_SALVES_START = Date.parse("2026-11-05T14:00:00Z");
export const HOURLY_FIRST_PARIS_HOUR = 12;
export const HOURLY_LAST_PARIS_HOUR = 21;
export const HOURLY_SALVE_GAP_MS = 50 * 60_000;
export const HOURLY_SERIES_GUARD_MS = 3 * 3_600_000;
// Ordre de passage : la campagne suivante complète le passage seulement
// quand la précédente n'a plus personne de disponible.
export const HOURLY_SALVE_QUEUE: readonly CampaignId[] = ["offres", "dernierappel"];

const parisHourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" });

export function parisHour(now: number): number {
  const hour = parisHourFormat.formatToParts(new Date(now)).find((p) => p.type === "hour")?.value;
  return Number(hour);
}

export function inHourlySalves(now: number): boolean {
  if (now < HOURLY_SALVES_START) return false;
  const hour = parisHour(now);
  return hour >= HOURLY_FIRST_PARIS_HOUR && hour <= HOURLY_LAST_PARIS_HOUR;
}

export type HourlySalvePlan =
  | { kind: "skipped"; reason: "hors_fenetre" | "deja_parti" }
  | { kind: "run"; size: number };

// sentRecently : emails des campagnes de HOURLY_SALVE_QUEUE partis dans les
// HOURLY_SALVE_GAP_MS qui précèdent (tous déclencheurs confondus).
export function planHourlySalve(now: number, sentRecently: number): HourlySalvePlan {
  if (!inHourlySalves(now)) return { kind: "skipped", reason: "hors_fenetre" };
  const size = HOURLY_SALVE_SIZE - Math.max(0, sentRecently);
  if (size <= 0) return { kind: "skipped", reason: "deja_parti" };
  return { kind: "run", size };
}
