// Réponse de /api/applications/auto-send (un fichier route.ts ne peut
// exporter que ses méthodes HTTP et sa configuration).

// « email » : envoi direct à l'adresse publiée par l'entreprise.
// « lba » : candidature transmise par La bonne alternance (service public,
// gratuit), qui l'envoie elle-même au recruteur.
export type AutoSendChannel = "email" | "lba";

export type AutoSendResult =
  | { status: "ready"; company: string; to: string; channel: AutoSendChannel; sentToday: number; limit: number }
  | {
      status: "sent";
      company: string;
      to: string;
      from: string;
      sentToday: number;
      limit: number;
      channel: AutoSendChannel;
      // 25 envois en moins de 4 h : pause jusqu'à cette heure (ISO), voir autoPace.
      pausedUntil?: string;
    }
  | {
      status: "manual";
      reason: AutoSendManualReason;
      company?: string;
      sentToday?: number;
      limit?: number;
      // pace_pause : heure de reprise de l'envoi automatique (ISO).
      resumeAt?: string;
    }
  // Trop d'envois en même temps sur tout Stageio (limite de l'API) : à
  // réessayer dans quelques secondes.
  | { status: "busy"; company?: string }
  | { status: "error"; company?: string };

export type AutoSendManualReason =
  | "no_email"
  | "inbox_off"
  | "lba_off"
  | "no_cv"
  | "cv_too_big"
  | "no_phone"
  | "no_name"
  | "already_sent"
  | "auto_required"
  | "daily_limit"
  | "pace_pause"
  | "not_found";

// Infos que l'étudiant peut compléter sur place, au moment du like.
export const FIXABLE_REASONS: AutoSendManualReason[] = ["no_cv", "no_phone", "no_name"];

export const LBA_LABEL = "La bonne alternance";

// Pause de sécurité (31/10, Nathan) : en plus des 100 par jour, jamais plus
// de 25 candidatures automatiques en 4 heures. Sinon une boîte qui envoie 25
// messages d'un coup avec pièce jointe finit classée en spam ou bloquée, et
// l'adresse d'envoi avec elle. Fenêtre glissante : 25 envois étalés sur plus
// de 4 heures ne déclenchent rien. Pendant la pause, les likes restent des
// favoris et l'étudiant postule à la main. Jamais annoncée avant : ni sur le
// paywall ni dans les pages de vente, seulement au moment où elle s'applique.
export const AUTO_PACE_LIMIT = 25;
export const AUTO_PACE_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 * Heure de reprise (ms) si `sentAt` (envois automatiques, dates en ms, dans
 * n'importe quel ordre) compte déjà `AUTO_PACE_LIMIT` envois dans les
 * dernières 4 heures avant `now` ; sinon null. La reprise a lieu quand le
 * plus ancien des 25 derniers envois sort de la fenêtre.
 */
export function autoPace(sentAt: number[], now: number): number | null {
  const recent = sentAt.filter((t) => t > now - AUTO_PACE_WINDOW_MS && t <= now).sort((a, b) => b - a);
  if (recent.length < AUTO_PACE_LIMIT) return null;
  return recent[AUTO_PACE_LIMIT - 1] + AUTO_PACE_WINDOW_MS;
}

const parisClock = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "2-digit", hourCycle: "h23" });
const parisDate = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** « 18 h 30 », ou « demain à 1 h 05 » si la reprise tombe le lendemain (heure de Paris). */
export function resumeLabel(resumeAt: number, now: number): string {
  const parts = parisClock.formatToParts(resumeAt);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const clock = minute === "00" ? `${hour} h` : `${hour} h ${minute}`;
  return parisDate.format(resumeAt) === parisDate.format(now) ? clock : `demain à ${clock}`;
}

const parisDay = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const parisHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" });

/** Minuit à Paris le jour de `now`, en ISO : le quota de 100 envois repart chaque jour à 0 h. */
export function parisMidnightIso(now: number): string {
  const day = parisDay.format(now);
  // Décalage de Paris à cet instant (+1 h ou +2 h), lu sur l'heure affichée.
  const offset = (((Number(parisHour.format(now)) - new Date(now).getUTCHours()) % 24) + 24) % 24;
  return new Date(Date.parse(`${day}T00:00:00Z`) - offset * 3600_000).toISOString();
}
