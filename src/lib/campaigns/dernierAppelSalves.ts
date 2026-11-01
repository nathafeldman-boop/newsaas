// Salves « Dernier appel » (Nathan, 1/11 : « Programme des salves de 300 par
// heure à partir de 10h »). Fichier à part, sans dépendance : lu par la route
// cron et par la série Premium (qui se met en pause pendant les salves).
//
// - Un passage par heure, de 10 h à 19 h (heure de Paris), le 1/11 seulement :
//   vercel.json appelle la route tous les jours, la fenêtre ci-dessous la
//   referme ensuite toute seule.
// - Chaque passage envoie 300 emails au plus, avec les garde-fous de
//   /admin/relance (jamais deux fois le même compte, désabonnés, payants et
//   plafond par 24 h exclus).
// - Garde contre un double appel (Vercel peut rappeler une route, un clic sur
//   le bouton de l'admin peut tomber dans l'heure) : 300 emails au plus par
//   tranche de 50 minutes, tous déclencheurs confondus.

export const LASTCALL_SALVE_SIZE = 300;
// Heure d'hiver depuis le 25/10 : 9 h UTC = 10 h à Paris.
export const LASTCALL_SALVES_START = Date.parse("2026-11-01T09:00:00Z");
// 19 h UTC = 20 h à Paris : le dernier passage est celui de 18 h UTC (19 h à Paris).
export const LASTCALL_SALVES_END = Date.parse("2026-11-01T19:00:00Z");
export const LASTCALL_SALVE_GAP_MS = 50 * 60_000;

export function inLastCallSalves(now: number): boolean {
  return now >= LASTCALL_SALVES_START && now < LASTCALL_SALVES_END;
}

export type SalvePlan =
  | { kind: "skipped"; reason: "hors_fenetre" | "deja_parti" }
  | { kind: "run"; size: number };

// sentRecently : emails « Dernier appel » partis dans les LASTCALL_SALVE_GAP_MS
// qui précèdent (tous déclencheurs confondus).
export function planLastCallSalve(now: number, sentRecently: number): SalvePlan {
  if (!inLastCallSalves(now)) return { kind: "skipped", reason: "hors_fenetre" };
  const size = LASTCALL_SALVE_SIZE - Math.max(0, sentRecently);
  if (size <= 0) return { kind: "skipped", reason: "deja_parti" };
  return { kind: "run", size };
}
